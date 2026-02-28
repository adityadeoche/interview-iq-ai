fetch("http://localhost:3000/api/drives/join", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ driveId: "hr_fa1d8a40-bb75-45cd-b636-2e3d94772b5c", code: "QGTMXC" }) // Testing Delloite
}).then(r => r.json()).then(console.log).catch(console.error);
