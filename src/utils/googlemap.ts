import axios from 'axios';
import { getconfigSecrets } from './getConfig';
import logger from './logger';

interface Coordinates {
    lat: number;
    lng: number;
}

// Function to get the latitude and longitude for a given postcode
export const getCoordinates = async (postcode: string): Promise<Coordinates> => {
    const config = await getconfigSecrets();
    console.log('Creating google map with config', config);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${postcode}&key=${config.googlemapapi}`;
    const response = await axios.get(url);
    if (response.data.status === 'OK') {
        const location = response.data.results[0].geometry.location;
        return location;
    } else {
        throw new Error(`Error fetching coordinates for postcode ${postcode}: ${response.data.status}`);
    }
};

// Haversine formula to calculate the distance between two coordinates in miles
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon1 - lon2); // Fixed: Corrected longitude difference calculation
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in miles
    return distance;
};

export const getDistanceBetweenPostcodes = async (originPostcode: string, destinationPostcode: string) => {
    const config = await getconfigSecrets();
    const baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';
    const kilometersToMilesConversionFactor = 0.621371;

    try {
        const response = await axios.get(baseUrl, {
            params: {
                origins: originPostcode,
                destinations: destinationPostcode,
                key: config.googlemapapi,
            },
        });

        logger.info('Google distance response', { response: response.data });

        if (response.data.status !== 'OK') {
            throw new Error(`Error with the API request: ${response.data.status}`);
        }

        const distanceInfo = response.data.rows[0].elements[0];

        if (distanceInfo.status === 'NOT_FOUND') {
            throw new Error('One or both of the postcodes are invalid or not found.');
        } else if (distanceInfo.status !== 'OK') {
            throw new Error(`Error with the distance calculation: ${distanceInfo.status}`);
        }

        const distanceInMeters = distanceInfo.distance.value;
        const distanceInMiles = (distanceInMeters / 1000) * kilometersToMilesConversionFactor;

        return distanceInMiles;
    } catch (error: any) {
        logger.error('Error fetching distance data:', error);
        throw new Error(`Failed to fetch distance data: ${error.message}`);
    }
};
