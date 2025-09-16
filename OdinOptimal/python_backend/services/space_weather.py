"""
ODIN Space Weather Service
Provides space weather data and forecasting for mission planning
"""

import requests
import random
from datetime import datetime, timedelta
from models.space_weather import SpaceWeather

class SpaceWeatherService:
    """Space weather monitoring and forecasting service"""
    
    def __init__(self):
        self.noaa_api_base = "https://services.swpc.noaa.gov/products"
        self.solar_flux_threshold = 150  # SFU (Solar Flux Units)
        self.geomagnetic_threshold = 5   # Kp index
    
    def get_current_solar_activity(self):
        """Get current solar activity data"""
        try:
            # In production, this would fetch real NOAA/NASA data
            # For now, simulating realistic space weather data
            
            current_time = datetime.utcnow()
            
            # Simulate solar flux (realistic range: 70-300 SFU)
            solar_flux = random.uniform(75, 280)
            
            # Simulate geomagnetic index (Kp: 0-9)
            geomagnetic_index = random.uniform(0, 7)
            
            # Generate solar events based on current activity
            solar_events = []
            if solar_flux > self.solar_flux_threshold:
                solar_events.append({
                    'type': 'solar_flare',
                    'class': self._classify_solar_flare(solar_flux),
                    'peak_time': current_time.isoformat(),
                    'intensity': solar_flux,
                    'duration': random.randint(10, 180)  # minutes
                })
            
            if geomagnetic_index > self.geomagnetic_threshold:
                solar_events.append({
                    'type': 'geomagnetic_storm',
                    'severity': self._classify_geomagnetic_storm(geomagnetic_index),
                    'start_time': (current_time - timedelta(hours=2)).isoformat(),
                    'duration': random.randint(6, 48)  # hours
                })
            
            # Check for CME events
            if random.random() > 0.85:  # 15% chance
                solar_events.append({
                    'type': 'cme',
                    'speed': random.uniform(300, 2000),  # km/s
                    'arrival_time': (current_time + timedelta(hours=random.uniform(18, 72))).isoformat(),
                    'impact_probability': random.uniform(0.3, 0.9)
                })
            
            return {
                'timestamp': current_time.isoformat(),
                'solar_flux': solar_flux,
                'geomagnetic_index': geomagnetic_index,
                'solar_events': solar_events,
                'risk_level': self._calculate_risk_level(solar_flux, geomagnetic_index),
                'data_source': 'NOAA SWPC (simulated)'
            }
            
        except Exception as e:
            raise Exception(f"Failed to get solar activity data: {str(e)}")
    
    def get_solar_activity_forecast(self, start_time, end_time):
        """Get solar activity forecast for specified time period, blended with ingested events if available"""
        try:
            forecast_hours = int((end_time - start_time).total_seconds() / 3600)
            forecast_data = []

            current = start_time
            while current <= end_time:
                # Simulate baseline forecast with some randomness
                base_flux = 120 + random.uniform(-30, 80)
                base_kp = 2.5 + random.uniform(-1.5, 3.5)

                # Add temporal correlation
                if forecast_data:
                    prev_flux = forecast_data[-1]['solar_flux']
                    prev_kp = forecast_data[-1]['geomagnetic_index']
                    base_flux = prev_flux * 0.8 + base_flux * 0.2
                    base_kp = prev_kp * 0.7 + base_kp * 0.3

                forecast_point = {
                    'timestamp': current.isoformat(),
                    'solar_flux': max(70, min(300, base_flux)),
                    'geomagnetic_index': max(0, min(9, base_kp)),
                    'confidence': random.uniform(0.6, 0.9)
                }

                # Add probability of significant events
                if forecast_point['solar_flux'] > 180:
                    forecast_point['flare_probability'] = random.uniform(0.2, 0.7)
                if forecast_point['geomagnetic_index'] > 4:
                    forecast_point['storm_probability'] = random.uniform(0.3, 0.8)

                forecast_data.append(forecast_point)
                current += timedelta(hours=6)  # 6-hour intervals

            # Blend historical ingested events into forecast and risk
            try:
                events = SpaceWeather.query \
                    .filter(SpaceWeather.timestamp >= start_time) \
                    .filter(SpaceWeather.timestamp <= end_time) \
                    .order_by(SpaceWeather.timestamp.asc()) \
                    .all()
            except Exception:
                events = []

            high_risk_periods = self._identify_high_risk_periods(forecast_data)
            if events:
                # Map events into high risk periods and nudge nearby forecast points
                for ev in events:
                    ev_ts = ev.timestamp
                    ev_payload = ev.solar_events or {}
                    severity = (ev_payload.get('severity') or '').lower()
                    risk_boost = {'low': 0.05, 'moderate': 0.12, 'medium': 0.12, 'high': 0.25, 'critical': 0.4}.get(severity, 0.1)

                    # Add explicit high-risk entry
                    high_risk_periods.append({
                        'timestamp': ev_ts.isoformat(),
                        'risk_score': min(0.9, 0.5 + risk_boost),
                        'event': ev_payload,
                    })

                    # Nudge nearest forecast point's indices upward slightly
                    nearest = min(forecast_data, key=lambda p: abs(datetime.fromisoformat(p['timestamp']) - ev_ts))
                    nearest['solar_flux'] = min(300, nearest['solar_flux'] * (1.0 + risk_boost))
                    nearest['geomagnetic_index'] = min(9.0, nearest['geomagnetic_index'] * (1.0 + risk_boost * 0.6))

            return {
                'forecast_period': {
                    'start': start_time.isoformat(),
                    'end': end_time.isoformat()
                },
                'forecast_data': forecast_data,
                'summary': self._generate_forecast_summary(forecast_data),
                'high_risk_periods': high_risk_periods,
                'data_source': 'simulated+historical' if events else 'simulated'
            }

        except Exception as e:
            raise Exception(f"Failed to generate solar activity forecast: {str(e)}")
    
    def get_24h_forecast(self):
        """Get 24-hour space weather forecast"""
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(hours=24)
        return self.get_solar_activity_forecast(start_time, end_time)
    
    def _classify_solar_flare(self, solar_flux):
        """Classify solar flare based on intensity"""
        if solar_flux < 150:
            return 'A'
        elif solar_flux < 170:
            return 'B'
        elif solar_flux < 200:
            return 'C'
        elif solar_flux < 230:
            return 'M'
        else:
            return 'X'
    
    def _classify_geomagnetic_storm(self, kp_index):
        """Classify geomagnetic storm based on Kp index"""
        if kp_index < 5:
            return 'minor'
        elif kp_index < 6:
            return 'moderate'
        elif kp_index < 7:
            return 'strong'
        elif kp_index < 8:
            return 'severe'
        else:
            return 'extreme'
    
    def _calculate_risk_level(self, solar_flux, geomagnetic_index):
        """Calculate overall space weather risk level"""
        flux_risk = min(solar_flux / 300, 1.0)
        geo_risk = min(geomagnetic_index / 9, 1.0)
        
        combined_risk = (flux_risk * 0.6 + geo_risk * 0.4)
        
        if combined_risk < 0.3:
            return 0.1  # Low risk
        elif combined_risk < 0.6:
            return 0.4  # Moderate risk
        elif combined_risk < 0.8:
            return 0.7  # High risk
        else:
            return 0.9  # Critical risk
    
    def _generate_forecast_summary(self, forecast_data):
        """Generate human-readable forecast summary"""
        max_flux = max(point['solar_flux'] for point in forecast_data)
        max_kp = max(point['geomagnetic_index'] for point in forecast_data)
        
        summary = []
        
        if max_flux > 200:
            summary.append(f"High solar activity expected (max flux: {max_flux:.0f} SFU)")
        elif max_flux > 150:
            summary.append(f"Moderate solar activity expected (max flux: {max_flux:.0f} SFU)")
        else:
            summary.append("Low to moderate solar activity expected")
        
        if max_kp > 6:
            summary.append(f"Geomagnetic storms possible (max Kp: {max_kp:.1f})")
        elif max_kp > 4:
            summary.append(f"Minor geomagnetic disturbances possible (max Kp: {max_kp:.1f})")
        
        return summary
    
    def _identify_high_risk_periods(self, forecast_data):
        """Identify periods with elevated space weather risk"""
        high_risk_periods = []
        
        for i, point in enumerate(forecast_data):
            risk_score = self._calculate_risk_level(point['solar_flux'], point['geomagnetic_index'])
            
            if risk_score > 0.6:  # High or critical risk
                high_risk_periods.append({
                    'timestamp': point['timestamp'],
                    'risk_score': risk_score,
                    'solar_flux': point['solar_flux'],
                    'geomagnetic_index': point['geomagnetic_index'],
                    'duration': '6 hours'  # Forecast interval
                })
        
        return high_risk_periods
