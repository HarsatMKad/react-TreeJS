export default function angleToXY(Ax, Ay, Az, Bx, By, Bz) {
  const AB = {
    x: Bx - Ax,
    y: By - Ay,
    z: Bz - Az,
  };

  const dot = AB.z;
  const magnitude = Math.sqrt(AB.x * AB.x + AB.y * AB.y + AB.z * AB.z);
  const cos = dot/magnitude;

  const theta = Math.acos(cos);
  const alpha = Math.PI/2 - theta;

  return alpha * (180 / Math.PI);
}