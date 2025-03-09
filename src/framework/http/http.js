export async function Http(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error("Network error");
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
}