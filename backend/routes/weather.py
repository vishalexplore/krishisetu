from fastapi import APIRouter, HTTPException
import requests

router = APIRouter(prefix="/weather", tags=["Weather"])

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


@router.get("/")
def get_weather(latitude: float, longitude: float):

    params = {
        "latitude": latitude,
        "longitude": longitude,

        "current": ",".join([
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "weather_code",
            "wind_speed_10m",
            "wind_direction_10m",
            "precipitation",
            "is_day",
        ]),

        "daily": ",".join([
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "apparent_temperature_max",
            "apparent_temperature_min",
            "precipitation_probability_max",
            "precipitation_sum",
            "rain_sum",
            "wind_speed_10m_max",
            "sunrise",
            "sunset",
        ]),

        "timezone": "auto",
        "forecast_days": 7,
    }

    try:
        response = requests.get(
            OPEN_METEO_URL,
            params=params,
            timeout=15,
        )

        response.raise_for_status()

        data = response.json()

        return data

    except requests.Timeout:
        raise HTTPException(
            status_code=504,
            detail="Weather service timeout. Please try again."
        )

    except requests.RequestException as error:
        print("Open-Meteo error:", error)

        raise HTTPException(
            status_code=502,
            detail="Weather service temporarily unavailable."
        )

    except Exception as error:
        print("Weather route error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to load weather data."
        )