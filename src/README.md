# Slalom Capabilities Management API

<p align="center">
  <img src="https://colby-timm.github.io/images/byte-teacher.png" alt="Byte Teacher" width="200" />
</p>

A FastAPI application that enables Slalom consultants to register their capabilities and manage consulting expertise across the organization.

## Features

- View all available consulting capabilities
- Register consultant expertise and availability
- Track consultant skill levels, certifications, and industry preferences
- Browse a consultant directory with registered capabilities
- Manage capability capacity and team assignments
- Persist consultant and capability data in a local JSON store

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc
   - Capabilities Dashboard: http://localhost:8000/

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/capabilities`                                                   | Get all capabilities with current consultant profile assignments    |
| GET    | `/consultants`                                                    | Get all consultant profiles and their registered capabilities       |
| POST   | `/capabilities/{capability_name}/register`                        | Register or enrich a consultant profile for a capability            |
| DELETE | `/capabilities/{capability_name}/unregister?email=consultant@slalom.com` | Unregister consultant from a capability              |

## Data Model

The application uses a consulting-focused data model:

1. **Capabilities** - Uses capability name as identifier:
   - Description of the consulting capability
   - Skill levels (Emerging, Proficient, Advanced, Expert)
   - Practice area (Strategy, Technology, Operations)
   - Industry verticals served
   - Required certifications
   - List of registered consultant references
   - Available capacity (hours per week)
   - Geographic location preferences

2. **Consultants** - Uses email as identifier:
   - Name
   - Practice area
   - Skill level
   - Certifications
   - Availability
   - Preferred industries
   - Registered capabilities

All data is now stored in `src/data/consulting_data.json` for this learning exercise so consultant profiles and registrations survive application restarts. In a production environment, this would be backed by a robust database system.

## Future Enhancements

This exercise will guide you through implementing:
- Capability maturity assessments
- Intelligent team matching algorithms  
- Analytics dashboards for practice leads
- Integration with project management systems
- Advanced search and filtering capabilities
