export async function checkWebsiteStatus(url) {
    try {
      const response = await fetch(url, { method: 'GET', timeout: 5000 });
      if (response.ok) {
        console.log(`${url} is ACTIVE ✅`);
        return true;
      } else {
        console.log(`${url} is NOT OK (Status: ${response.status}) ❌`);
        return false;
      }
    } catch (error) {
      console.log(`${url} is DOWN or Unreachable ❌`);
      return false;
    }
  }
  