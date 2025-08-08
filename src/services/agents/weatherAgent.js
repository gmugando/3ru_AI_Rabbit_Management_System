import apiConfig from '@/utils/apiConfig.js';

class WeatherAgent {
  constructor(openaiApiKey, weatherApiKey, defaultLocation = 'Denver, CO', userPreferences = null) {
    this.openaiApiKey = openaiApiKey;
    this.weatherApiKey = weatherApiKey; // OpenWeatherMap API key
    this.defaultLocation = defaultLocation; // Farm location fallback
    this.userPreferences = userPreferences;
    
    console.log('WeatherAgent - API keys:', {
      openai: openaiApiKey ? 'Present' : 'Missing',
      weather: weatherApiKey ? 'Present' : 'Missing',
      defaultLocation: defaultLocation,
      temperatureUnit: userPreferences?.temperature_unit || 'fahrenheit'
    });
  }

  async processQuery(query) {
    try {
      // Step 1: Extract location from query or use default
      const location = await this.extractLocation(query);
      console.log('WeatherAgent: Using location:', location);
      
      // Step 2: Get weather data
      const weatherData = await this.getWeatherData(location);
      
      // Step 3: Generate farm-relevant analysis
      const analysis = await this.analyzeFarmImpact(weatherData, query);
      
      return {
        success: true,
        location: location,
        weather: weatherData,
        analysis: analysis,
        recommendations: this.getFarmRecommendations(weatherData),
        agent: 'weather',
        originalQuery: query
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        agent: 'weather',
        originalQuery: query
      };
    }
  }

  async extractLocation(query) {
    try {
      // Use centralized API configuration to extract location from natural language
      const response = await apiConfig.makeChatCompletionRequest(
        [
          {
            role: 'system',
            content: `Extract the location from the user's weather query. If no specific location is mentioned, return "DEFAULT". 

Examples:
"What's the weather in Denver?" → "Denver, CO"
"How's the weather in New York City?" → "New York City, NY"
"Will it rain tomorrow?" → "DEFAULT"
"Temperature in Los Angeles" → "Los Angeles, CA"
"Weather forecast" → "DEFAULT"

Return only the location string, nothing else.`
          },
          { role: 'user', content: query }
        ],
        this.openaiApiKey,
        {
          temperature: 0.1,
          max_tokens: 50
        }
      )

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = await response.json();
      let extractedLocation = result.choices[0].message.content.trim();
      
      // Clean up any quotes around the response
      extractedLocation = extractedLocation.replace(/^["']|["']$/g, '');
      
      // Use default location if none specified
      const finalLocation = extractedLocation === 'DEFAULT' ? this.defaultLocation : extractedLocation;
      console.log('WeatherAgent: Location extraction result:', {
        raw: result.choices[0].message.content.trim(),
        cleaned: extractedLocation,
        final: finalLocation,
        defaultLocation: this.defaultLocation
      });
      
      return finalLocation;
      
    } catch (error) {
      console.error('Error extracting location:', error);
      return this.defaultLocation; // Fallback to farm location
    }
  }

  async getWeatherData(location) {
    try {
      if (!this.weatherApiKey || this.weatherApiKey === 'your_weather_api_key_here') {
        // Return mock data if no API key configured
        return this.getMockWeatherData(location);
      }

      // Determine units based on user preferences
      const units = this.getWeatherUnits();
      const unitSymbol = this.getTemperatureSymbol();

      // Get coordinates first
      const geoResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${this.weatherApiKey}`
      );
      
      if (!geoResponse.ok) {
        throw new Error('Failed to get location coordinates');
      }
      
      const geoData = await geoResponse.json();
      if (geoData.length === 0) {
        throw new Error(`Location not found: ${location}`);
      }
      
      const { lat, lon } = geoData[0];

      // Get current weather and forecast with user-preferred units
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.weatherApiKey}&units=${units}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.weatherApiKey}&units=${units}`)
      ]);

      if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error('Failed to get weather data');
      }

      const [current, forecast] = await Promise.all([
        currentResponse.json(),
        forecastResponse.json()
      ]);

      return {
        current: {
          temperature: Math.round(current.main.temp),
          feelsLike: Math.round(current.main.feels_like),
          humidity: current.main.humidity,
          pressure: current.main.pressure,
          description: current.weather[0].description,
          windSpeed: Math.round(current.wind.speed),
          windDirection: current.wind.deg,
          temperatureUnit: unitSymbol
        },
        forecast: forecast.list.slice(0, 8).map(item => ({
          time: new Date(item.dt * 1000).toLocaleString(),
          temperature: Math.round(item.main.temp),
          description: item.weather[0].description,
          humidity: item.main.humidity,
          windSpeed: Math.round(item.wind.speed),
          temperatureUnit: unitSymbol
        })),
        location: geoData[0].name + ', ' + geoData[0].country,
        temperatureUnit: unitSymbol
      };
      
    } catch (error) {
      console.error('Error getting weather data:', error);
      return this.getMockWeatherData(location);
    }
  }

  getMockWeatherData(location) {
    const unitSymbol = this.getTemperatureSymbol();
    const isCelsius = this.userPreferences?.temperature_unit === 'celsius';
    
    // Mock data for demonstration when no API key is available
    // Convert to Celsius if user prefers Celsius
    const mockTemps = {
      current: isCelsius ? 20 : 68,
      feelsLike: isCelsius ? 22 : 72,
      forecast: isCelsius ? [21, 18, 14, 22] : [70, 65, 58, 72]
    };
    
    return {
      current: {
        temperature: mockTemps.current,
        feelsLike: mockTemps.feelsLike,
        humidity: 45,
        pressure: 1013,
        description: 'partly cloudy',
        windSpeed: 8,
        windDirection: 180,
        temperatureUnit: unitSymbol
      },
      forecast: [
        { time: 'Today 3:00 PM', temperature: mockTemps.forecast[0], description: 'sunny', humidity: 40, windSpeed: 6, temperatureUnit: unitSymbol },
        { time: 'Today 6:00 PM', temperature: mockTemps.forecast[1], description: 'partly cloudy', humidity: 50, windSpeed: 8, temperatureUnit: unitSymbol },
        { time: 'Tomorrow 9:00 AM', temperature: mockTemps.forecast[2], description: 'cloudy', humidity: 60, windSpeed: 10, temperatureUnit: unitSymbol },
        { time: 'Tomorrow 12:00 PM', temperature: mockTemps.forecast[3], description: 'sunny', humidity: 35, windSpeed: 5, temperatureUnit: unitSymbol }
      ],
      location: location + ' (Mock Data)',
      temperatureUnit: unitSymbol
    };
  }

  getWeatherUnits() {
    // OpenWeatherMap API units: 'metric' for Celsius, 'imperial' for Fahrenheit
    return this.userPreferences?.temperature_unit === 'celsius' ? 'metric' : 'imperial';
  }

  getTemperatureSymbol() {
    return this.userPreferences?.temperature_unit === 'celsius' ? '°C' : '°F';
  }

  convertTemperature(temp, fromUnit, toUnit) {
    if (fromUnit === toUnit) return temp;
    
    if (fromUnit === 'fahrenheit' && toUnit === 'celsius') {
      return Math.round((temp - 32) * 5/9);
    } else if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
      return Math.round((temp * 9/5) + 32);
    }
    
    return temp;
  }

  async analyzeFarmImpact(weatherData, originalQuery) {
    try {
      const tempUnit = weatherData.temperatureUnit || this.getTemperatureSymbol();
      const systemPrompt = `You are a rabbit farming expert analyzing weather impact on rabbit operations.

Current Weather:
- Temperature: ${weatherData.current.temperature}${tempUnit} (feels like ${weatherData.current.feelsLike}${tempUnit})
- Humidity: ${weatherData.current.humidity}%
- Conditions: ${weatherData.current.description}
- Wind: ${weatherData.current.windSpeed} mph

Provide practical advice for rabbit farmers based on this weather. Focus on:
1. Rabbit health and comfort
2. Housing adjustments needed
3. Feeding considerations  
4. Breeding timing impacts
5. Any immediate actions needed

Keep response concise and actionable.`;

      const response = await apiConfig.makeChatCompletionRequest(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Weather query: "${originalQuery}"\n\nWhat should rabbit farmers know about these conditions?` }
        ],
        this.openaiApiKey,
        {
          temperature: 0.3,
          max_tokens: 800
        }
      )

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.choices[0].message.content.trim();
      
    } catch (error) {
      console.error('Error analyzing farm impact:', error);
      return this.getBasicFarmAnalysis(weatherData);
    }
  }

  getBasicFarmAnalysis(weatherData) {
    const temp = weatherData.current.temperature;
    const humidity = weatherData.current.humidity;
    const tempUnit = weatherData.temperatureUnit || this.getTemperatureSymbol();
    const isCelsius = this.userPreferences?.temperature_unit === 'celsius';
    
    // Temperature thresholds based on unit
    const coldThreshold = isCelsius ? 10 : 50;  // 10°C = 50°F
    const hotThreshold = isCelsius ? 27 : 80;   // 27°C = 80°F
    
    let analysis = `Weather Analysis for Rabbit Farming:\n\n`;
    
    // Temperature analysis
    if (temp < coldThreshold) {
      analysis += `🥶 Cold Alert: At ${temp}${tempUnit}, provide extra bedding and windbreak protection. Monitor for signs of cold stress.\n\n`;
    } else if (temp > hotThreshold) {
      analysis += `🔥 Heat Alert: At ${temp}${tempUnit}, ensure adequate ventilation and shade. Provide extra water and consider cooling measures.\n\n`;
    } else {
      analysis += `✅ Comfortable Temperature: ${temp}${tempUnit} is ideal for rabbit comfort and productivity.\n\n`;
    }
    
    // Humidity analysis
    if (humidity > 70) {
      analysis += `💧 High Humidity: ${humidity}% humidity can stress rabbits. Improve ventilation and monitor for respiratory issues.\n\n`;
    } else if (humidity < 30) {
      analysis += `🌵 Low Humidity: ${humidity}% humidity is quite dry. Monitor water consumption and respiratory health.\n\n`;
    }
    
    return analysis;
  }

  getFarmRecommendations(weatherData) {
    const temp = weatherData.current.temperature;
    const isCelsius = this.userPreferences?.temperature_unit === 'celsius';
    
    // Temperature thresholds based on unit
    const coldThreshold = isCelsius ? 10 : 50;  // 10°C = 50°F
    const hotThreshold = isCelsius ? 27 : 80;   // 27°C = 80°F
    
    const recommendations = [];
    
    if (temp < coldThreshold) {
      recommendations.push('Add extra bedding for warmth');
      recommendations.push('Check water systems for freezing');
      recommendations.push('Provide windbreak protection');
    } else if (temp > hotThreshold) {
      recommendations.push('Ensure adequate ventilation');
      recommendations.push('Provide shade and cooling');
      recommendations.push('Increase water availability');
      recommendations.push('Monitor for heat stress signs');
    }
    
    if (weatherData.current.humidity > 70) {
      recommendations.push('Improve hutch ventilation');
      recommendations.push('Monitor for respiratory issues');
    }
    
    if (weatherData.current.windSpeed > 15) {
      recommendations.push('Secure hutch doors and equipment');
      recommendations.push('Provide wind protection');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Weather conditions are favorable for normal operations');
    }
    
    return recommendations;
  }
}

export default WeatherAgent; 