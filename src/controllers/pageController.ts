import type { Response } from 'express';
import { Page } from '../models/Page.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import slugify from 'slugify';

export const getPages = async (req: AuthRequest, res: Response) => {
  try {
    const pages = await Page.find({ status: 'published' });
    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener páginas' });
  }
};

export const getPageBySlug = async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const page = await Page.findOne({ slug, status: 'published' });
    if (!page) return res.status(404).json({ message: 'Página no encontrada' });
    res.json(page);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener página' });
  }
};

export const upsertPage = async (req: AuthRequest, res: Response) => {
  try {
    const { id, title, slug, hero, sections, isHome, status } = req.body;
    
    let page;
    if (id) {
      page = await Page.findById(id);
      if (!page) return res.status(404).json({ message: 'Página no encontrada' });
    } else {
      page = new Page();
    }

    page.title = title;
    page.slug = slug || (isHome ? 'home' : slugify(title, { lower: true }));
    page.isHome = isHome || false;
    page.hero = hero;
    page.sections = sections;
    page.status = status || 'published';

    if (isHome) {
      await Page.updateMany({ _id: { $ne: page._id } }, { isHome: false });
    }

    await page.save();
    res.json(page);
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar página' });
  }
};

export const deletePage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Page.findByIdAndDelete(id);
    res.json({ message: 'Página eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar página' });
  }
};
