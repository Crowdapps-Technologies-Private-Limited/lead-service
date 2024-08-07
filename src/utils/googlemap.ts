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

// Lambda function to get the distance between two postcodes
export const getDistanceBetweenPostcodes = async (postcode1: string, postcode2: string): Promise<number | null> => {
    try {
        const coords1 = await getCoordinates(postcode1);
        const coords2 = await getCoordinates(postcode2);
        logger.info(`Coordinates for ${postcode1}:`, { coords1 });
        logger.info(`Coordinates for ${postcode2}:`, { coords2 });
        const distance = calculateDistance(coords1.lat, coords1.lng, coords2.lat, coords2.lng);
        return distance;
    } catch (error: any) {
        console.error(error.message);
        return null;
    }
};
