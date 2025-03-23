# Searchable

The goal of Searchable is to build a framework that allows building information deposit and retrieval systems completely declaratively.

This will enable websites to change from Twitter to Uber, from Amazon to Tinder with only a configuration change.

## Core Concepts

There are only 2 types of existence in the world of information:
1. A thing that consumes information
2. The thing that is information itself

Let's call the things that interact with information **Terminals**. 
Let's call the thing that is information, available to be discovered, **Searchable**.

- A Terminal usually has some static data associated with it.
- A Searchable is always produced by a Terminal.

## Interaction Model

How do they interact?
- A Terminal can send a Searchable to the PUBLIC
- A Terminal can search for a Searchable from the PUBLIC
- A Terminal can also send a Searchable to a specific Terminal

Hence we have **public** and **private** Searchable.

Private Searchable has part of the information that is only visible to certain terminals. Hence a **Visibility Check** is needed.

## Schema Definition

We can define the Searchable schema as follows:

```
{
    id: string;
    payloads: {
        "public": {
            "name": {
                "type": "string",
                "description": "The name of the Searchable",
            },
            "visibility": {
                "udf": "allways_true", // def allways_true(searchable, terminal, data)
                "data": {}, // data is passed to the udf
            }
        },
        "private": {
            "name": {
                "type": "string",
                "description": "The name of the Searchable",
            },
            "viwers":{
                "type": "array",
                "description": "The terminals that can see the Searchable",
                "items": {
                    "type": "string",
                    "description": "The id of the terminal"
                }
            },
            "visibility": {
                "udf": "only_viewers", // def only_viewers(searchable, terminal, data)
                "data": {}, // data is passed to the udf
            }
        }
    }
};
```
