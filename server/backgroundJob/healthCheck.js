export async function checkWebsiteStatus(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "HealthCheck/1.0",
      },
    });

    clearTimeout(timeout);

    if (response.status < 500) {
      console.log(`${url} is ACTIVE ✅ (${response.status})`);
      return true;
    }

    console.log(`${url} is SERVER ERROR ❌ (${response.status})`);
    return false;
  } catch (err) {
    console.log(`${url} is DOWN or TIMEOUT ❌`);
    return false;
  }
}
