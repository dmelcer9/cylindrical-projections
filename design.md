1. Figure out where each source point ends up (sort of reverse of projection computation- somehow reuse code?)
2. Line from source to dest, move constant amount on that line instead of proportional?

List of required functions
- Given uv on original sphere, get final destination in 3d space
- Given uv on projection surface, get uv on original sphere (if any)

Generic helpers
- uv on sphere -> source point in 3d space
- move distance d along line from source to destination 3d points
- two points, get ray starting from first point that passes through second

For light-based
- 3d source point + 3d proj surface point -> location of intersection(s) of ray with sphere


Required functions
- Light source projection
  - UV on orig sphere -> final dest in 3d space
    - Convert uv on sphere to source point in 3d space
    - Get ray from light source
    - Get distance of all projection planes that ray passes through
    - If ray passes through sphere twice:
      - Is this the closer or farther point?
      - Option: Use near side for light sources outside sphere
        - Discard vs move on
    - If ray doesn't pass through sphere, discard
    - Optional: "Backwards" projection? 
      - Filter planes where d < dist(sphere point, light source point)
      - Take max dist of remaining planes (if exists)
    - Otherwise:
      - Filter planes where d > dist(sphere point, light source point)
      - Take min dist of remaining planes (if exists) 
    - Move distance min(d, time) along ray
      - If backwards, move max(-d, time, dist from light source)
    - If discarded, move up to time along ray
  - UV on projection surface -> UV on original sphere
    - Convert uv on proj surface to source point in 3d space
    - Get ray from light source
    - Get all intersections of ray with sphere
    - Get distance of all projection planes that ray passes through
    - Use basically same logic as orig sphere -> final dest
  - Subroutine: Get min dist of projection surfaces
    - For all proj surfaces
      - Does ray pass through surface
      - What 3d point / what distance along does ray pass through surface
      - Plane
        - Dist along ray that it intersects
        - Make sure d is positive
        - Make sure d is within boundaries
        - Automatic positioning of plane should be done from JS code
      - Cylinder
      - Cone?
  - Subroutine: Get ray from light source
    - 3d point (projection surface etc) -> light source point
    - Point source: return constant
    - Line source: get plane normal to line source that intersects point, then intersect line source
    - Plane source: project point to plane
- Conformal projection
  - ???


  