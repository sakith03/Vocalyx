# Vocalyx Backend - User Authentication API

This is the backend service for FinSight, providing user authentication and authorization functionality using JWT tokens.

## Features

- User registration with validation
- User login with JWT token generation
- JWT-based authentication
- Role-based authorization (USER, ADMIN)
- Password encryption using BCrypt
- Global exception handling
- CORS configuration for frontend integration

## Technology Stack

- **Framework**: Spring Boot 3.4.5
- **Language**: Java 21
- **Database**: MySQL
- **Security**: Spring Security with JWT
- **Build Tool**: Maven
- **Validation**: Bean Validation (Jakarta Validation)

## API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. User Registration
```
POST /api/users/register
Content-Type: application/json

{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "password123"
}
```

**Response (201 Created):**
```json
{
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "USER",
    "createdAt": "2024-01-01T10:00:00"
}
```

#### 2. User Login
```
POST /api/users/login
Content-Type: application/json

{
    "email": "john.doe@example.com",
    "password": "password123"
}
```

**Response (200 OK):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 3. Health Check
```
GET /api/users/health
```

**Response (200 OK):**
```
User service is running
```

#### 4. Public Test Endpoint
```
GET /api/test/public
```

**Response (200 OK):**
```json
{
    "message": "This is a public endpoint"
}
```

### Protected Endpoints (Authentication Required)

#### 1. Protected Test Endpoint
```
GET /api/test/protected
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
    "message": "This is a protected endpoint",
    "user": "john.doe@example.com",
    "authorities": ["USER"]
}
```

## Database Schema

The application creates a `users` table with the following structure:

```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Configuration

### Application Properties
```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3307/EVENTURA?createDatabaseIfNotExist=true
spring.datasource.username=FORALL
spring.datasource.password=FORALL1234

# JWT Configuration
jwt.secret=your-secret-key-here-make-it-long-and-secure-for-production
jwt.expiration=86400000
```

## Running the Application

1. **Prerequisites:**
   - Java 21
   - MySQL running on port 3307
   - Maven

2. **Start MySQL:**
   ```bash
   # Make sure MySQL is running on port 3307
   # Database: EVENTURA
   # Username: FORALL
   # Password: FORALL1234
   ```

3. **Run the application:**
   ```bash
   cd finsight_backend
   mvn spring-boot:run
   ```

4. **Access the API:**
   - Base URL: `http://localhost:8080`
   - API Documentation: Available at runtime

## Testing the API

### Using curl:

1. **Register a new user:**
   ```bash
   curl -X POST http://localhost:8080/api/users/register \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "John",
       "lastName": "Doe",
       "email": "john.doe@example.com",
       "password": "password123"
     }'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:8080/api/users/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john.doe@example.com",
       "password": "password123"
     }'
   ```

3. **Access protected endpoint:**
   ```bash
   curl -X GET http://localhost:8080/api/test/protected \
     -H "Authorization: Bearer <jwt_token_from_login>"
   ```

## Security Features

- **Password Encryption**: All passwords are encrypted using BCrypt
- **JWT Tokens**: Stateless authentication using JSON Web Tokens
- **Role-based Access**: Different endpoints require different roles
- **CORS Configuration**: Configured for frontend integration
- **Input Validation**: All inputs are validated using Bean Validation
- **Exception Handling**: Comprehensive error handling with meaningful messages

## Next Steps

This authentication system provides a solid foundation for the FinSight application. The next steps would typically involve:

1. Adding more user management features (profile update, password reset)
2. Implementing financial data models and APIs
3. Adding more sophisticated authorization rules
4. Integrating with external financial data sources
5. Building the frontend React application
