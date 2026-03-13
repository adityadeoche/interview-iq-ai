import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/dashboard/",
                "/interview/",
                "/mock-interviews/",
                "/settings/",
                "/campus/dashboard/",
                "/recruiter/dashboard/"
            ],
        },
        sitemap: "https://interview-iq-ai.onrender.com/sitemap.xml",
    };
}
