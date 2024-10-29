// Middleware to validate request body during registration and login
export default (req, res, next) => {
    const { user_id, name, password } = req.body;
  
    if (req.path === "/register") {
      if (![ user_id, name, password].every(Boolean)) {
        return res.status(401).json({message: "Missing Credentials"});
      }
    } else if (req.path === "/login") {
      if (![ user_id, password].every(Boolean)) {
        return res.status(401).json({message: "Missing Credentials"});
      }
    }
  
    next();
  };