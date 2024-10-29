// Import required modules
import jwt from "jsonwebtoken"; // For generating JWT tokens
import dotenv from "dotenv"; // For loading environment variables

// Load environment variables from .env file
dotenv.config();

/**
 * Function to generate a JWT token.
 * @param {string | number} user_id - The ID of the user for whom the token is generated.
 * @returns {string} - The signed JWT token.
 */
function jwtGenerator(user_id) {
    // The payload is the data you want to include in the token
    const payload = {
        user: user_id // In this case, we're including the user's ID in the token
    };

    // Generate and return the token, signed with the secret key and set to expire in 1 hour
    return jwt.sign(payload, process.env.jwtSecret, { expiresIn: "1h" });
}

// Export the jwtGenerator function as a default export
export default jwtGenerator;
