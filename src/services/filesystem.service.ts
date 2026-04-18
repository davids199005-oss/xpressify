import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { ProjectExistsError } from '../utils/errors';

export const filesystemService = {
  exists: async (targetPath: string): Promise<boolean> => {
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  },

  createProjectDir: async (targetDir: string): Promise<void> => {
    const dirName = path.basename(targetDir);
    const alreadyExists = await filesystemService.exists(targetDir);
    if (alreadyExists) {
      throw new ProjectExistsError(dirName);
    }
    await fse.ensureDir(targetDir);
  },

  writeFile: async (filePath: string, content: string): Promise<void> => {
    await fse.outputFile(filePath, content, 'utf-8');
  },

  readFile: async (filePath: string): Promise<string> => {
    return fs.readFile(filePath, 'utf-8');
  },

  copyFile: async (src: string, dest: string): Promise<void> => {
    await fse.copy(src, dest);
  },
};