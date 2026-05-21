import prisma from '../prisma.js';
export const getLinksByType = async (req, res) => {
    try {
        const type = req.params.type;
        const links = await prisma.utilityLink.findMany({ where: { type } });
        res.status(200).json(links);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch links' });
    }
};
export const createLinkInfo = async (req, res) => {
    try {
        const { siteName, siteUrl, type, imageUrl, linkImageId } = req.body;
        const newLink = await prisma.utilityLink.create({
            data: { siteName, siteUrl, type, imageUrl, linkImageId },
        });
        res.status(201).json(newLink);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create link' });
    }
};
