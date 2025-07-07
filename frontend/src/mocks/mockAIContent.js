// Mock AI Content data

export const mockAIContents = [
  {
    id: 1,
    title: "Product Catalog Q1 2024",
    status: "submitted",
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    file_count: 5,
    instructions: "Please create individual listings for each product in the catalog. Include product descriptions, pricing, and specifications.",
    metadata: {
      files: [
        {
          fileId: "file-ai-1",
          fileName: "product_catalog_2024.pdf",
          fileSize: 2548576,
          mimeType: "application/pdf"
        },
        {
          fileId: "file-ai-2",
          fileName: "product_images.zip",
          fileSize: 15728640,
          mimeType: "application/zip"
        },
        {
          fileId: "file-ai-3",
          fileName: "pricing_sheet.xlsx",
          fileSize: 524288,
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        },
        {
          fileId: "file-ai-4",
          fileName: "specifications.docx",
          fileSize: 1048576,
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        },
        {
          fileId: "file-ai-5",
          fileName: "brand_guidelines.pdf",
          fileSize: 3145728,
          mimeType: "application/pdf"
        }
      ]
    }
  },
  {
    id: 2,
    title: "Marketing Materials Update",
    status: "processed",
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    file_count: 3,
    instructions: "Update all marketing materials with new branding. Create social media posts and email templates.",
    metadata: {
      files: [
        {
          fileId: "file-ai-6",
          fileName: "new_logo.png",
          fileSize: 204800,
          mimeType: "image/png"
        },
        {
          fileId: "file-ai-7",
          fileName: "marketing_copy.docx",
          fileSize: 524288,
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        },
        {
          fileId: "file-ai-8",
          fileName: "design_templates.psd",
          fileSize: 52428800,
          mimeType: "image/vnd.adobe.photoshop"
        }
      ],
      processedAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      processedBy: "employee1",
      notes: "Created 15 social media posts and 3 email templates"
    }
  },
  {
    id: 3,
    title: "Technical Documentation",
    status: "submitted",
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    file_count: 8,
    instructions: "Convert technical documentation into user-friendly guides. Create tutorials and FAQ sections.",
    metadata: {
      files: [
        {
          fileId: "file-ai-9",
          fileName: "api_documentation.md",
          fileSize: 102400,
          mimeType: "text/markdown"
        },
        {
          fileId: "file-ai-10",
          fileName: "user_manual.pdf",
          fileSize: 5242880,
          mimeType: "application/pdf"
        },
        {
          fileId: "file-ai-11",
          fileName: "screenshots.zip",
          fileSize: 10485760,
          mimeType: "application/zip"
        },
        {
          fileId: "file-ai-12",
          fileName: "video_tutorials.mp4",
          fileSize: 104857600,
          mimeType: "video/mp4"
        },
        {
          fileId: "file-ai-13",
          fileName: "integration_guide.docx",
          fileSize: 2097152,
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        },
        {
          fileId: "file-ai-14",
          fileName: "troubleshooting.xlsx",
          fileSize: 524288,
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        },
        {
          fileId: "file-ai-15",
          fileName: "release_notes.txt",
          fileSize: 20480,
          mimeType: "text/plain"
        },
        {
          fileId: "file-ai-16",
          fileName: "architecture_diagram.png",
          fileSize: 1048576,
          mimeType: "image/png"
        }
      ]
    }
  }
];

// Function to get user's AI contents
export const getUserAIContents = () => {
  return {
    success: true,
    data: {
      ai_contents: mockAIContents.map(content => ({
        id: content.id,
        title: content.title,
        status: content.status,
        created_at: content.created_at,
        file_count: content.file_count
      })),
      total: mockAIContents.length
    }
  };
};

// Function to get specific AI content
export const getAIContentById = (id) => {
  const content = mockAIContents.find(c => c.id === parseInt(id));
  if (!content) {
    return {
      success: false,
      msg: "AI content not found"
    };
  }
  
  return {
    success: true,
    data: content
  };
};

// Function to create new AI content
export const createAIContent = (data) => {
  const newContent = {
    id: mockAIContents.length + 1,
    title: data.title,
    instructions: data.instructions,
    status: "submitted",
    created_at: new Date().toISOString(),
    file_count: data.files.length,
    metadata: {
      files: data.files,
      processedAt: null,
      processedBy: null,
      notes: null
    }
  };
  
  mockAIContents.unshift(newContent);
  
  return {
    success: true,
    data: {
      id: newContent.id,
      message: "AI content created successfully"
    }
  };
};