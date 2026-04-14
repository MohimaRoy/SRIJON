async function test() {
  const r = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', email: 'test1@test.com', password: 'password123' })
  });
  console.log('Status:', r.status);
  console.log(await r.json());
}
test();
