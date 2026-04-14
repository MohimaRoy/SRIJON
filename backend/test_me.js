async function test() {
  const r = await fetch('http://localhost:5000/api/auth/me');
  console.log('Status:', r.status);
  console.log(await r.text());
}
test();
