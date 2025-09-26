'use server';

export async function validateUSZip(zipCode: string): Promise<{
	valid: boolean;
	city?: string;
	state?: string;
	error?: string;
}> {
	try {
		const response = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zipCode)}`, {
			method: "GET",
			headers: { "content-type": "application/json" },
			cache: "no-store",
		});
		if (!response.ok) {
			return { valid: false, error: `ZIP code ${zipCode} not found` };
		}
		const data = await response.json();
		const place = Array.isArray(data.places) && data.places.length > 0 ? data.places[0] : undefined;
		return {
			valid: true,
			city: place?.["place name"],
			state: place?.["state abbreviation"] ?? place?.state,
		};
	} catch {
		return { valid: false, error: "ZIP validation failed. Please try again." };
	}
}