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


│ > Immediate Actions:                                                                                                 │
│     1. Add rate limiting (nginx limit_req module)                                                                    │
│     2. Add security headers to nginx                                                                                 │
│     3. Remove DEV_BYPASS_TOKEN from production                                                                       │
│     4. Implement fail2ban for SSH and nginx logs                                                                     │
│     5. Add request validation/sanitization                                                                           │
│                                                                                                                      │
│     Medium-term:                                                                                                     │
│     1. Implement API rate limiting per user/IP                                                                       │
│     2. Add WAF (Web Application Firewall) rules                                                                      │
│     3. Use Redis for JWT blacklist instead of DB                                                                     │
│     4. Add monitoring/alerting for suspicious patterns                                                               │
│     5. Implement proper CORS policy                                                                                  │
│                                                                                                                      │
│     Long-term:                                                                                                       │
│     1. Move to asymmetric JWT (RS256)                                                                                │
│     2. Add API gateway with built-in security                                                                        │
│     3. Implement comprehensive logging and SIEM                                                                      │
│     4. Regular security audits                                                                                       │
│     5. Consider Cloudflare or similar DDoS protection explain to me why each one is important




migration plan: 1. user_ids 2. add_searchables_columns_and_indexes 3. withdrawal status checks