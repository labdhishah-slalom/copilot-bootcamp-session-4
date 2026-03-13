"""
Slalom Capabilities Management System API

A FastAPI application that enables Slalom consultants to register their
capabilities and manage consulting expertise across the organization.
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field, validator

app = FastAPI(title="Slalom Capabilities Management API",
              description="API for managing consulting capabilities and consultant expertise")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")
data_file = current_dir / "data" / "consulting_data.json"


class ConsultantRegistration(BaseModel):
    email: EmailStr
    name: str = ""
    practice_area: str = ""
    skill_level: str = ""
    certifications: List[str] = Field(default_factory=list)
    availability: Optional[int] = Field(default=None, ge=0, le=40)
    preferred_industries: List[str] = Field(default_factory=list)

    @validator("practice_area")
    def validate_practice_area(cls, value: str) -> str:
        """Normalize and validate practice area if provided."""
        if value is None:
            return ""
        normalized = value.strip()
        if not normalized:
            # Allow empty / unspecified practice area
            return ""
        allowed_practice_areas = {
            "Strategy",
            "Technology",
            "Operations",
            "Sales",
            "Finance",
            "Data & Analytics",
        }
        if normalized not in allowed_practice_areas:
            raise ValueError("Unsupported practice_area value")
        return normalized

    @validator("skill_level")
    def validate_skill_level(cls, value: str) -> str:
        """Normalize and validate skill level if provided."""
        if value is None:
            return ""
        normalized = value.strip()
        if not normalized:
            # Allow empty / unspecified skill level
            return ""
        allowed_skill_levels = {
            "Junior",
            "Mid",
            "Senior",
            "Principal",
            "Director",
        }
        if normalized not in allowed_skill_levels:
            raise ValueError("Unsupported skill_level value")
        return normalized

    @validator("certifications", "preferred_industries", each_item=True)
    def normalize_list_items(cls, value: str) -> str:
        """Trim whitespace from list items and reject empty entries."""
        if value is None:
            raise ValueError("List items must be non-empty strings")
        normalized = value.strip()
        if not normalized:
            raise ValueError("List items must be non-empty strings")
        return normalized


def load_data() -> Dict[str, Any]:
    with data_file.open("r", encoding="utf-8") as file_handle:
        return json.load(file_handle)


def save_data(data: Dict[str, Any]) -> None:
    with data_file.open("w", encoding="utf-8") as file_handle:
        json.dump(data, file_handle, indent=2)


def normalize_text(value: str) -> str:
    return value.strip()


def normalize_list(values: List[str]) -> List[str]:
    cleaned: List[str] = []
    for value in values:
        normalized = normalize_text(value)
        if normalized:
            cleaned.append(normalized)
    return list(dict.fromkeys(cleaned))


def build_consultant_profile(email: str, consultant: Dict[str, Any], capabilities: Dict[str, Any]) -> Dict[str, Any]:
    registered_capabilities = sorted(
        capability_name
        for capability_name, capability in capabilities.items()
        if email in capability.get("consultants", [])
    )
    return {
        "email": email,
        "name": consultant.get("name", email),
        "practice_area": consultant.get("practice_area", ""),
        "skill_level": consultant.get("skill_level", ""),
        "certifications": consultant.get("certifications", []),
        "availability": consultant.get("availability"),
        "preferred_industries": consultant.get("preferred_industries", []),
        "registered_capabilities": registered_capabilities,
    }


def build_capabilities_response(data: Dict[str, Any]) -> Dict[str, Any]:
    consultants = data.get("consultants", {})
    capabilities = data.get("capabilities", {})
    response = {}

    for capability_name, capability in capabilities.items():
        consultant_profiles = [
            build_consultant_profile(email, consultants.get(email, {}), capabilities)
            for email in capability.get("consultants", [])
        ]
        consultant_profiles.sort(key=lambda item: item["name"])

        response[capability_name] = {
            **capability,
            "consultants": consultant_profiles,
            "consultant_count": len(consultant_profiles),
        }

    return response


def build_consultants_response(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    capabilities = data.get("capabilities", {})
    consultants = data.get("consultants", {})
    profiles = [
        build_consultant_profile(email, consultant, capabilities)
        for email, consultant in consultants.items()
    ]
    profiles.sort(key=lambda item: item["name"])
    return profiles


def default_name_from_email(email: str) -> str:
    local_part = email.split("@", maxsplit=1)[0]
    return local_part.replace(".", " ").replace("_", " ").title()


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/capabilities")
def get_capabilities():
    return build_capabilities_response(load_data())


@app.get("/consultants")
def get_consultants():
    return build_consultants_response(load_data())


@app.post("/capabilities/{capability_name}/register")
def register_for_capability(capability_name: str, consultant: ConsultantRegistration):
    """Register a consultant for a capability and persist their profile."""
    data = load_data()
    capabilities = data.get("capabilities", {})
    consultants = data.get("consultants", {})

    if capability_name not in capabilities:
        raise HTTPException(status_code=404, detail="Capability not found")

    email = normalize_text(consultant.email).lower()
    if not email:
        raise HTTPException(status_code=400, detail="Consultant email is required")

    capability = capabilities[capability_name]

    if email in capability.get("consultants", []):
        raise HTTPException(
            status_code=400,
            detail="Consultant is already registered for this capability"
        )

    existing_profile = consultants.get(email, {})

    # Determine a safe default skill level from the capability definition.
    skill_levels = capability.get("skill_levels") or []
    if isinstance(skill_levels, list) and skill_levels:
        default_skill_level = skill_levels[0]
    else:
        default_skill_level = ""

    consultants[email] = {
        "name": normalize_text(consultant.name) or existing_profile.get("name") or default_name_from_email(email),
        "practice_area": normalize_text(consultant.practice_area) or existing_profile.get("practice_area") or capability.get("practice_area", ""),
        "skill_level": normalize_text(consultant.skill_level) or existing_profile.get("skill_level") or default_skill_level,
        "certifications": normalize_list(consultant.certifications) or existing_profile.get("certifications", []),
        "availability": consultant.availability if consultant.availability is not None else existing_profile.get("availability", 40),
        "preferred_industries": normalize_list(consultant.preferred_industries) or existing_profile.get("preferred_industries", []),
    }

    capability.setdefault("consultants", []).append(email)
    save_data(data)

    return {
        "message": f"Registered {consultants[email]['name']} for {capability_name}",
        "consultant": build_consultant_profile(email, consultants[email], capabilities),
    }


@app.delete("/capabilities/{capability_name}/unregister")
def unregister_from_capability(capability_name: str, email: str):
    """Unregister a consultant from a capability"""
    data = load_data()
    capabilities = data.get("capabilities", {})

    if capability_name not in capabilities:
        raise HTTPException(status_code=404, detail="Capability not found")

    capability = capabilities[capability_name]
    normalized_email = normalize_text(email).lower()

    if normalized_email not in capability.get("consultants", []):
        raise HTTPException(
            status_code=400,
            detail="Consultant is not registered for this capability"
        )

    capability["consultants"].remove(normalized_email)
    save_data(data)

    return {"message": f"Unregistered {normalized_email} from {capability_name}"}
