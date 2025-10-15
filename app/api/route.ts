import { ApiReference } from '@scalar/nextjs-api-reference'

const openApiSpec = {
  "openapi": "3.0.3",
  "info": {
    "title": "SFU Course Prerequisites API",
    "description": "Public API for accessing course prerequisite data from the SFU crowdsourcing system. Includes all courses with a status field indicating whether they have been parsed or not.",
    "version": "2.0.0",
    "contact": {
      "name": "SFU Crowdsourcing Team",
      "url": "https://github.com/Highfire1/crowdsourcing"
    }
  },
  "servers": [
    {
      "url": "/api/public",
      "description": "Public API endpoints"
    }
  ],
  "security": [
    {
      "ApiKeyAuth": []
    }
  ],
  "components": {
    "securitySchemes": {
      "ApiKeyAuth": {
        "type": "apiKey",
        "in": "header",
        "name": "x-api-key",
        "description": "API key for accessing the public endpoints"
      }
    },
    "schemas": {
      "Course": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique course identifier"
          },
          "dept": {
            "type": "string",
            "description": "Department code (e.g., CMPT, MATH)",
            "example": "CMPT"
          },
          "number": {
            "type": "string",
            "description": "Course number (e.g., 101, 215)",
            "example": "101"
          },
          "title": {
            "type": "string",
            "description": "Course title",
            "example": "Introduction to Computing"
          },
          "description": {
            "type": "string",
            "description": "Course description"
          },
          "prerequisites": {
            "type": "string",
            "description": "Original prerequisite text from course catalog"
          },
          "corequisites": {
            "type": "string",
            "description": "Original corequisite text from course catalog"
          },
          "notes": {
            "type": "string",
            "description": "Additional course notes from catalog"
          },
          "parse_status": {
            "type": "string",
            "description": "Internal parsing status (ai_parsed, human_verified, no_parse_needed, etc.)",
            "example": "human_verified"
          },
          "status": {
            "type": "string",
            "enum": ["parsed", "unparsed"],
            "description": "Simple status indicator: 'parsed' (has verified/parsed data) or 'unparsed' (not yet parsed)",
            "example": "parsed"
          },
          "parsed_prerequisites": {
            "type": "object",
            "description": "Structured prerequisite data (JSON object) - null for unparsed courses",
            "nullable": true
          },
          "parsed_credit_conflicts": {
            "type": "object",
            "description": "Credit exclusion data (JSON object) - null for unparsed courses",
            "nullable": true
          },
          "verified_at": {
            "type": "string",
            "format": "date-time",
            "description": "Timestamp when the course was verified (null if not verified)",
            "nullable": true
          }
        }
      },
      "ExportMetadata": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "example": "SFU Verified Course Prerequisites Export"
          },
          "description": {
            "type": "string"
          },
          "exportDate": {
            "type": "string",
            "format": "date-time"
          },
          "totalCourses": {
            "type": "integer",
            "example": 150
          },
          "apiVersion": {
            "type": "string",
            "example": "2.0"
          },
          "fields": {
            "type": "object",
            "description": "Field descriptions for the course data"
          },
          "note": {
            "type": "string"
          }
        }
      },
      "ExportResponse": {
        "type": "object",
        "properties": {
          "metadata": {
            "$ref": "#/components/schemas/ExportMetadata"
          },
          "courses": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Course"
            }
          }
        }
      },
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "error": {
            "type": "string",
            "description": "Error message"
          },
          "message": {
            "type": "string",
            "description": "Detailed error description"
          }
        }
      }
    }
  },
  "paths": {
    "/export-verified-courses": {
      "get": {
        "summary": "Export All Course Prerequisites",
        "description": "Returns ALL SFU courses with prerequisite information. Each course has a 'status' field indicating whether it has been parsed ('parsed') or not yet parsed ('unparsed'). Unparsed courses include basic information but have null parsed data.",
        "operationId": "exportVerifiedCourses",
        "security": [
          {
            "ApiKeyAuth": []
          }
        ],
        "parameters": [
          {
            "name": "api_key",
            "in": "query",
            "description": "API key (alternative to header)",
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successfully exported all courses",
            "headers": {
              "X-Cache": {
                "description": "Cache status",
                "schema": {
                  "type": "string",
                  "enum": ["HIT", "MISS"]
                }
              },
              "Cache-Control": {
                "description": "Cache control header",
                "schema": {
                  "type": "string"
                }
              }
            },
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ExportResponse"
                },
                "example": {
                  "metadata": {
                    "title": "SFU Course Prerequisites Export",
                    "description": "This file contains ALL SFU courses...",
                    "exportDate": "2025-10-14T12:00:00.000Z",
                    "totalCourses": 1500,
                    "apiVersion": "2.0"
                  },
                  "courses": [
                    {
                      "id": "course_1",
                      "dept": "CMPT",
                      "number": "101",
                      "title": "Introduction to Computing",
                      "description": "An overview of computing...",
                      "prerequisites": "None",
                      "corequisites": "",
                      "notes": "",
                      "parse_status": "human_verified",
                      "status": "parsed",
                      "parsed_prerequisites": null,
                      "parsed_credit_conflicts": null,
                      "verified_at": "2025-10-14T10:30:00.000Z"
                    },
                    {
                      "id": "course_2",
                      "dept": "MATH",
                      "number": "308",
                      "title": "Linear Optimization",
                      "description": "Linear programming...",
                      "prerequisites": "MATH 232 or 240",
                      "corequisites": "",
                      "notes": "",
                      "parse_status": "ai_parsed",
                      "status": "unparsed",
                      "parsed_prerequisites": null,
                      "parsed_credit_conflicts": null,
                      "verified_at": null
                    }
                  ]
                }
              }
            }
          },
          "401": {
            "description": "Invalid or missing API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                },
                "example": {
                  "error": "Invalid or missing API key",
                  "message": "Please provide a valid API key via x-api-key header or api_key query parameter"
                }
              }
            }
          },
          "429": {
            "description": "Rate limit exceeded",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                },
                "example": {
                  "error": "Rate limit exceeded",
                  "message": "Maximum 10 requests per minute allowed"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                },
                "example": {
                  "error": "Server error: Database connection failed"
                }
              }
            }
          }
        }
      }
    }
  }
}

const config = {
  content: JSON.stringify(openApiSpec)
}

export const GET = ApiReference(config)