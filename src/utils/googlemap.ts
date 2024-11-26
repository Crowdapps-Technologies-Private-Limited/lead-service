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
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${postcode}&region=gb&key=${config.googlemapapi}`;
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
    const dLon = toRadians(lon1 - lon2);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in miles
    return distance;
};

// Main function to calculate the distance between two UK postcodes
export const getDistanceBetweenPostcodes = async (
    originPostcode: string,
    destinationPostcode: string,
): Promise<number> => {
    try {
        const originCoordinates = await getCoordinates(originPostcode);
        const destinationCoordinates = await getCoordinates(destinationPostcode);

        const distance = calculateDistance(
            originCoordinates.lat,
            originCoordinates.lng,
            destinationCoordinates.lat,
            destinationCoordinates.lng,
        );

        logger.info('Calculated distance in miles', { distance });

        return distance;
    } catch (error: any) {
        logger.error('Error calculating distance between postcodes:', error);
        throw new Error(`Failed to calculate distance between postcodes: ${error.message}`);
    }
};
