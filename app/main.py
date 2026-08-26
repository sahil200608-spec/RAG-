from fastapi import FastAPI

from app.api.routes import router 
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(

    CORSMiddleware,

    allow_origins=[

        "http://localhost:3000",

        "http://localhost:5173",

    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)

app.include_router(router)