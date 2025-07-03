// language=glsl
const shader_utils = `
    // Define a Ray structure
    struct Ray {
        vec3 origin;// Starting point of the ray
        vec3 direction;// Normalized direction vector of the ray
    };

    // Creates a ray starting at 'origin' and passing through 'target'
    Ray createRayOriginTarget(vec3 origin, vec3 target) {
        Ray ray;
        ray.origin = origin;// Set ray origin
        ray.direction = normalize(target - origin);// Calculate and normalize the direction vector
        return ray;
    }

    vec3 followRayAlongDistance(Ray ray, float distance) {
        return ray.origin + distance * ray.direction;
    }

    struct Globe {
        vec3 center;// Center of the globe
        float radius;// Radius of the sphere
        vec4 rotationQuaternion;// Rotation quaternion of the sphere
    };

    struct Plane {
        vec3 point;// A point on the plane
        vec3 normal;// Normal vector of the plane (should be normalized)
    };

    struct Cylinder {
        vec3 center;// Center of the cylinder's base
        vec3 axis;// Normalized vector representing the cylinder's axis
        float radius;// Radius of the cylinder
    };

    // Function to apply quaternion rotation to a 3D vector
    vec3 applyQuaternion(vec3 point, vec4 quat) {
        vec3 u = quat.xyz;
        float s = quat.w;

        // Rotation formula: point' = u * (2.0 * dot(u, point)) +
        //                    point * (s * s - dot(u, u)) +
        //                    cross(u, point) * (2.0 * s)
        return u * (2.0 * dot(u, point)) +
        point * (s * s - dot(u, u)) +
        cross(u, point) * (2.0 * s);
    }

    // Applies the inverse of a quaternion rotation to a 3D vector
    vec3 applyInverseQuaternion(vec3 point, vec4 quat) {
        // Compute the conjugate of the quaternion (inverse for unit quaternions)
        vec4 conjQuat = vec4(-quat.xyz, quat.w);

        // Applying the conjugate quaternion as a rotation
        return applyQuaternion(point, conjQuat);
    }

    // Function to map UV coordinates to a 3D position on the rotated sphere
    vec3 uvToSpherePosition(vec2 uv, Globe globe) {
        // Map UV coordinates to spherical angles: theta and phi
        float theta = uv.x * 2.0 * 3.1415926;// U -> longitude [0, 2π]
        float phi = uv.y * 3.1415926;// V -> latitude [0, π]

        // Convert spherical coordinates to Cartesian coordinates
        float x = globe.radius * sin(phi) * cos(theta);
        float y = globe.radius * cos(phi);
        float z = globe.radius * sin(phi) * sin(theta);
        vec3 localPosition = vec3(x, y, z);

        // Apply the rotation defined by the quaternion
        vec3 rotatedPosition = applyQuaternion(localPosition, globe.rotationQuaternion);

        // Offset by the sphere's center and return final position
        return rotatedPosition + globe.center;
    }

    // Function to map a 3D position on a rotated sphere to UV coordinates
    vec2 positionToUVOnSphere(vec3 position, Globe globe) {
        // Offset the position by the sphere's center
        vec3 localPosition = position - globe.center;

        // Apply the inverse of the rotation quaternion to undo the rotation
        vec3 unrotatedPosition = applyQuaternion(localPosition, globe.rotationQuaternion);

        // Normalize to ensure our point is on the sphere's surface
        vec3 normalizedPosition = normalize(unrotatedPosition);

        // Calculate spherical angles theta (longitude) and phi (latitude) from the position
        float theta = atan(normalizedPosition.z, normalizedPosition.x);// Longitude
        float phi = acos(normalizedPosition.y);// Latitude

        // Map angles to normalized UV coordinates
        float u = (theta / (2.0 * PI)) + 0.5;// Map theta from [-π, π] to [0, 1]
        float v = phi / PI;// Map phi from [0, π] to [0, 1]

        return vec2(0.5+u, -v);
    }

    // Returns number of intersections between ray and sphere
    int get_ray_sphere_intersection(Ray ray, Globe globe, out float distance1, out float distance2) {
        vec3 oc = ray.origin - globe.center;
        float a = dot(ray.direction, ray.direction);
        float b = 2.0 * dot(oc, ray.direction);
        float c = dot(oc, oc) - globe.radius * globe.radius;

        float discriminant = b * b - 4.0 * a * c;

        // No intersection
        if (discriminant < 0.0) {
            distance1 = -1.0;
            distance2 = -1.0;
            return 0;
        }

        // Calculate intersection distances
        float sqrtD = sqrt(discriminant);
        distance1 = (-b - sqrtD) / (2.0 * a);
        distance2 = (-b + sqrtD) / (2.0 * a);

        // One intersection point (ray is tangent to sphere)
        if (abs(discriminant) < 0.0001) {
            return 1;
        }

        // Two intersection points (one or both may be negative)
        return 2;
    }

    Ray normalize_ray(Ray ray) {
        Ray normalized;
        normalized.origin = ray.origin;
        normalized.direction = normalize(ray.direction);
        return normalized;
    }

    // Returns whether the ray intersects the plane
    // Outputs: 'intersectionDistance' - distance along the ray to the intersection point if it exists
    bool rayPlaneIntersection(Ray ray, Plane plane, out float intersectionDistance) {
        // Calculate the denominator of the ray-plane intersection formula
        float denominator = dot(plane.normal, ray.direction);

        // Check if the ray is parallel to the plane (denominator near 0)
        if (abs(denominator) < 1e-6) {
            intersectionDistance = -1.0;// No intersection
            return false;
        }

        // Calculate the distance to the intersection point
        vec3 originToPlane = plane.point - ray.origin;
        intersectionDistance = dot(originToPlane, plane.normal) / denominator;

        // If the intersection is behind the ray's origin, there's no valid intersection
        return intersectionDistance >= 0.0;
    }

    // Projects a point onto a ray and calculates the distance along the ray
    // Inputs: Ray ray (origin, direction), vec3 point (the point to project)
    // Outputs: vec3 - the closest point on the ray
    //          float distance - the distance along the ray to the projected point
    vec3 projectPointOntoRay(Ray ray, vec3 point, out float distance) {
        // Vector from the ray's origin to the given point
        vec3 originToPoint = point - ray.origin;

        // Project this vector onto the ray's direction
        distance = dot(originToPoint, ray.direction);// Distance along the ray's direction

        // Return the point on the ray at the calculated distance
        return ray.origin + distance * ray.direction;
    }

    // Projects a point onto a plane
    // Inputs: Plane (point, normal), vec3 (the point to project)
    // Outputs: vec3 - the closest point on the plane
    vec3 projectPointOntoPlane(Plane plane, vec3 point) {
        // Vector from the plane's point to the given point
        vec3 pointToPlane = point - plane.point;

        // Distance from the point to the plane along the plane's normal
        float distance = dot(pointToPlane, plane.normal);

        // Subtract the normal component to get the projected point
        return point - distance * plane.normal;
    }

    // Intersects a ray with an infinite cylinder
    // Inputs: Ray (origin, direction), Cylinder (center, axis, radius)
    // Outputs: float distance1, float distance2 (distances along the ray to intersections)
    // Returns: Number of intersections (0, 1, or 2)
    int intersectRayWithCylinder(Ray ray, Cylinder cylinder, out float distance1, out float distance2) {
        // Vector from the ray origin to the cylinder's center
        vec3 delta = ray.origin - cylinder.center;

        // Project ray direction and delta onto the cylinder's axis
        float projRayDirOnAxis = dot(ray.direction, cylinder.axis);
        float projDeltaOnAxis = dot(delta, cylinder.axis);

        // Remove the cylinder axis' components from the ray direction and delta
        vec3 rayDirPerpendicular = ray.direction - projRayDirOnAxis * cylinder.axis;
        vec3 deltaPerpendicular = delta - projDeltaOnAxis * cylinder.axis;

        // Quadratic coefficients for the intersection
        float a = dot(rayDirPerpendicular, rayDirPerpendicular);
        float b = 2.0 * dot(deltaPerpendicular, rayDirPerpendicular);
        float c = dot(deltaPerpendicular, deltaPerpendicular) - cylinder.radius * cylinder.radius;

        // Discriminant of the quadratic equation
        float discriminant = b * b - 4.0 * a * c;

        // If the discriminant is negative, the ray doesn't intersect the cylinder
        if (discriminant < 0.0) {
            distance1 = -1.0;
            distance2 = -1.0;
            return 0;
        }

        // Calculate distances to the intersection points
        float sqrtDiscriminant = sqrt(discriminant);
        distance1 = (-b - sqrtDiscriminant) / (2.0 * a);
        distance2 = (-b + sqrtDiscriminant) / (2.0 * a);

        // If discriminant is close to zero, the ray is tangent to the cylinder
        if (abs(discriminant) < 1e-6) {
            return 1;
        }

        // Otherwise, there are two intersection points
        return 2;
    }

    Globe getGlobe(){
        return Globe(
        globe_position,
        globe_radius,
        globe_rotation_quaternion
        );
    }

`

export default shader_utils;