from flask_restx import Resource
from flask import request, send_file
from .routes import token_required
from .track_metrics import *
from . import rest_api
import os
import uuid
import threading
import requests
import os
import time
import uuid

import base64
import openai

MESHY_API_KEY = os.environ.get("MESHY_API_KEY", "")
TEST_API_KEY = "msy_dummy_api_key_for_test_mode_12345678"
ACTIVE_API_KEY = MESHY_API_KEY
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
XAI_API_KEY = os.environ.get("XAI_API_KEY", "")
ART_STYLES = ["realistic", "sculpture"]

def get_image_descriptions(prompt, base64_image):
    """
    Process an image with XAI to get shape and texture descriptions.
    
    Args:
        prompt (str): The user's prompt to guide the description
        base64_image (str): Base64-encoded image data
        
    Returns:
        tuple: (shape_prompt, texture_prompt) descriptions for 3D modeling
    """
    try:
        client = openai.OpenAI(
            api_key=XAI_API_KEY,
            base_url="https://api.x.ai/v1",
        )
    
        completion = client.chat.completions.create(
            temperature=0.2,
            model="grok-2-vision-1212",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Describe this image in detail for 3D model generation in 2 parts with && as a separator, first part is focused on the shape and look (model mesh), second part is focused on the texture. DO NOT HAVE ANYTHING ELSE IN THE RESPONSE, JUST THE 2 PARTS SEPARATED BY && EACH PART LESS THAN 400 CHARACTERS. Also consider the users prompt: {prompt}"},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            },
                        },
                    ],
                }
            ],
        )
        
        # Extract shape and texture prompts from the image description
        image_description = completion.choices[0].message.content
        print(f"Image description: {image_description}")
        
        parts = image_description.split("&&")
        if len(parts) >= 2:
            shape_prompt = parts[0].strip()
            texture_prompt = parts[1].strip()
        else:
            # Fallback if the separator isn't found
            shape_prompt = image_description
            texture_prompt = f"Texture for {prompt}"
            
        return shape_prompt, texture_prompt
            
    except Exception as e:
        print(f"Error processing image with XAI: {str(e)}")
        # Fallback to original prompt if image processing fails
        shape_prompt = f"3D model of {prompt}"
        texture_prompt = f"Texture for {prompt}"
        return shape_prompt, texture_prompt


def create_model(prompt, model_id, base64_image, mesh_api_key=None, art_style="realistic"):
    """
    Create a 3D model using the Meshy API based on a text prompt and image.
    
    Args:
        prompt (str): The text prompt to guide the model generation
        model_id (str): Unique identifier for the model
        base64_image (str): Base64-encoded image data
        mesh_api_key (str, optional): Meshy API key. If not provided, uses environment variable.
        art_style (str, optional): Art style for the model
        
    Returns:
        dict: Information about the created model including UUID and file paths
    """

    if mesh_api_key is None:
        mesh_api_key = ACTIVE_API_KEY
    
    # Process the image to get shape and texture descriptions
    shape_prompt, texture_prompt = get_image_descriptions(prompt, base64_image)
    
    print(f"Shape prompt for model {model_id}: {shape_prompt}")
    print(f"Texture prompt for model {model_id}: {texture_prompt}")
    
    headers = {
        "Authorization": f"Bearer {mesh_api_key}"
    }
    
    # Create directory for the model
    os.makedirs(model_id, exist_ok=True)
    
    # Initialize metadata file
    metadata_path = f"{model_id}/metadata.txt"
    
    # 1. Generate a preview model and get the task ID
    generate_preview_request = {
        "mode": "preview",
        "prompt": shape_prompt,
        "art_style": art_style,
        "should_remesh": True,
    }
    
    generate_preview_response = requests.post(
        "https://api.meshy.ai/openapi/v2/text-to-3d",
        headers=headers,
        json=generate_preview_request,
    )
    
    generate_preview_response.raise_for_status()
    
    preview_task_id = generate_preview_response.json()["result"]
    
    # Save preview_task_id immediately
    with open(metadata_path, "w") as f:
        f.write(f"preview_task_id: {preview_task_id}\n")
    
    print(f"Preview task created for '{shape_prompt}'. Task ID: {preview_task_id}")
    
    # 2. Poll the preview task status until it's finished
    preview_task = None
    
    while True:
        preview_task_response = requests.get(
            f"https://api.meshy.ai/openapi/v2/text-to-3d/{preview_task_id}",
            headers=headers,
        )
        
        preview_task_response.raise_for_status()
        
        preview_task = preview_task_response.json()
        
        if preview_task["status"] == "SUCCEEDED":
            print("Preview task finished.")
            break
        
        print(f"Preview task status: {preview_task['status']} | Progress: {preview_task['progress']} | Retrying in 5 seconds...")
        time.sleep(5)
    
    # 3. Generate a refined model and get the task ID
    generate_refined_request = {
        "mode": "refine",
        "preview_task_id": preview_task_id,
        "texture_prompt": texture_prompt,
    }
    
    generate_refined_response = requests.post(
        "https://api.meshy.ai/openapi/v2/text-to-3d",
        headers=headers,
        json=generate_refined_request,
    )
    
    generate_refined_response.raise_for_status()
    
    refined_task_id = generate_refined_response.json()["result"]
    
    # Update metadata file with refined_task_id immediately
    with open(metadata_path, "w") as f:
        f.write(f"preview_task_id: {preview_task_id}\n")
        f.write(f"refined_task_id: {refined_task_id}\n")
    
    print("Refined task created. Task ID:", refined_task_id)
    
    # 4. Poll the refined task status until it's finished
    refined_task = None
    
    while True:
        refined_task_response = requests.get(
            f"https://api.meshy.ai/openapi/v2/text-to-3d/{refined_task_id}",
            headers=headers,
        )
        
        refined_task_response.raise_for_status()
        
        refined_task = refined_task_response.json()
        
        if refined_task["status"] == "SUCCEEDED":
            print("Refined task finished.")
            break
        
        print(f"Refined task status: {refined_task['status']} | Progress: {refined_task['progress']} | Retrying in 5 seconds...")
        time.sleep(5)
    
    # 5. Download the refined model files
    # Download the OBJ file
    obj_path = f"/{model_id}/{model_id}.obj"
    refined_model_url = refined_task["model_urls"]["obj"]
    refined_model_response = requests.get(refined_model_url)
    refined_model_response.raise_for_status()
    with open(obj_path, "wb") as f:
        f.write(refined_model_response.content)
    
    # Download the MTL file
    mtl_path = f"/{model_id}/{model_id}.mtl"
    mtl_url = refined_task["model_urls"]["mtl"]
    mtl_response = requests.get(mtl_url)
    mtl_response.raise_for_status()
    with open(mtl_path, "wb") as f:
        f.write(mtl_response.content)
    
    # Download the texture file (base color)
    texture_path = f"/{model_id}/texture_0.png"
    base_color = refined_task["texture_urls"][0]["base_color"]
    texture_response = requests.get(base_color)
    texture_response.raise_for_status()
    with open(texture_path, "wb") as f:
        f.write(texture_response.content)
    
    # Fix material references in OBJ file
    with open(obj_path, "r") as f:
        obj_content = f.read()
    
    # Update the MTL reference to match our file structure
    if "model.mtl" in obj_content:
        obj_content = obj_content.replace("model.mtl", f"{model_id}.mtl")
        with open(obj_path, "w") as f:
            f.write(obj_content)
    
    # Update texture references in MTL file
    with open(mtl_path, "r") as f:
        mtl_content = f.read()
    
    # Update any texture file references to use texture_0.png
    if "base_color.png" in mtl_content:
        mtl_content = mtl_content.replace("base_color.png", "texture_0.png")
        with open(mtl_path, "w") as f:
            f.write(mtl_content)
    
    # Metadata file is already updated with both task IDs
    
    print(f"Model created successfully. Files saved to '{model_id}' directory.")
    
    return {
        "id": model_id,
        "obj_path": obj_path,
        "mtl_path": mtl_path,
        "texture_path": texture_path,
        "preview_task_id": preview_task_id,
        "refined_task_id": refined_task_id
    }

def check_model(model_id, api_key=None):
    """
    Check the progress of a model creation task.
    
    Args:
        model_id (str): The ID of the model to check
        api_key (str, optional): Meshy API key. If not provided, uses environment variable.
        
    Returns:
        dict: Progress information for preview and refine stages
    """
    # Set up API key (use environment variable if not provided)
    if api_key is None:
        api_key = ACTIVE_API_KEY
    
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    
    # Initialize progress dictionary
    progress = {
        "preview": 0,
        "refine": 0
    }
    
    # Try to read the model metadata file if it exists
    metadata_path = f"/{model_id}/metadata.txt"
    preview_task_id = None
    refined_task_id = None
    
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, "r") as f:
                lines = f.readlines()
                for line in lines:
                    if "preview_task_id:" in line:
                        preview_task_id = line.split("preview_task_id:")[1].strip()
                    if "refined_task_id:" in line:
                        refined_task_id = line.split("refined_task_id:")[1].strip()
        except:
            print(f"Error reading metadata file for model {model_id}")
    
    # Check preview task progress if we have a task ID
    if preview_task_id:
        try:
            preview_task_response = requests.get(
                f"https://api.meshy.ai/openapi/v2/text-to-3d/{preview_task_id}",
                headers=headers,
            )
            print("preview_task_response", preview_task_response)
            
            if preview_task_response.status_code == 200:
                preview_task = preview_task_response.json()
                print(preview_task)
                if preview_task["status"] == "SUCCEEDED":
                    progress["preview"] = 100
                else:
                    progress["preview"] = int(preview_task['progress'])
        except:
            print(f"Error checking preview task for model {model_id}")
    
    # Check refined task progress if we have a task ID
    if refined_task_id:
        try:
            refined_task_response = requests.get(
                f"https://api.meshy.ai/openapi/v2/text-to-3d/{refined_task_id}",
                headers=headers,
            )
            
            if refined_task_response.status_code == 200:
                refined_task = refined_task_response.json()
                
                if refined_task["status"] == "SUCCEEDED":
                    progress["refine"] = 100
                else:
                    progress["refine"] = int(refined_task["progress"])
        except:
            print(f"Error checking refined task for model {model_id}")
    
    return progress


@rest_api.route('/api/v1/figyua/create', methods=['POST'])
class CreateFigyua(Resource):
    """
    Creates a new figyua
    """
    @token_required
    @track_metrics('create_figyua')
    def post(self, current_user, request_origin='unknown'):
        try:
            prompt = request.form.get('text')  
            image = request.files.get('image')
            
            if not image:
                return {"error": "Image is required"}, 400
                
            try:
                # Read and encode the image
                image_data = image.read()
                base64_image = base64.b64encode(image_data).decode("utf-8")
                
                # Generate multiple UUIDs for different art styles
                uuids = [str(uuid.uuid4()) for _ in range(6)]
                
                # Start model creation threads with different art styles
                for idx, uuid_value in enumerate(uuids):
                    thread = threading.Thread(
                        target=create_model, 
                        args=(prompt, uuid_value, base64_image),
                        kwargs={'art_style': ART_STYLES[idx % len(ART_STYLES)]}
                    )
                    thread.daemon = True
                    thread.start()
                
                return {
                    'success': True,
                    'uuids': uuids
                }, 200
                
            except Exception as e:
                print(f"Error processing image: {str(e)}")
                return {"error": str(e)}, 500
    
        except Exception as e:
            print(f"Error creating figura: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/obj/<string:name>')
class ServeObjFile(Resource):
    """
    Serves a 3D model OBJ file
    """
    def get(self, name):
        file_path = f"/{name}/{name}.obj"
        if os.path.exists(file_path):
            return send_file(file_path)
        else:
            return {"error": f"OBJ file {file_path} not found"}, 404

@rest_api.route('/api/mtl/<string:name>')
class ServeMtlFile(Resource):
    """
    Serves a material MTL file for a 3D model
    """
    def get(self, name):
        file_path = f"/{name}/{name}.mtl"
        if os.path.exists(file_path):
            return send_file(file_path)
        else:
            return {"error": f"MTL file {file_path} not found"}, 404

@rest_api.route('/api/png/<string:name>/texture_0.png')
class ServePngTexture(Resource):
    """
    Serves a texture PNG file for a 3D model
    """
    def get(self, name):
        file_path = f"/{name}/texture_0.png"
        if os.path.exists(file_path):
            return send_file(file_path)
        else:
            return {"error": f"PNG file {file_path} not found"}, 404

@rest_api.route('/api/check/<string:name>')
class CheckModelStatus(Resource):
    """
    Checks if model files exist and returns progress
    """
    def get(self, name):
        obj_path = f"/{name}/{name}.obj"
        mtl_path = f"/{name}/{name}.mtl"
        png_path = f"/{name}/texture_0.png"
        
        progress = check_model(name)

        files_exist = (
            os.path.exists(obj_path) and 
            os.path.exists(mtl_path) and 
            os.path.exists(png_path)
        )
        
        return {"exists": files_exist, "progress": progress}, 200

