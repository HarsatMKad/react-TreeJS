export default function findAzimuth(Ax, Ay, Az, Bx, By, Bz){
    const AB = {
        x: Bx - Ax,
        y: By - Ay,
        z: Bz - Az,
      };

      const azimuthRad = Math.atan2(AB.y, AB.x);
      const azimuthDeg = azimuthRad * (180 / Math.PI)

    return (azimuthDeg + 360) % 360;
}