import type { Category, NewCategory } from '@/modules/finance/data/models';
import type { ICategoryRepository } from '@/modules/finance/data/repositories/interfaces';

export class CategoryService {
  constructor(private repo: ICategoryRepository) {}

  list(kind?: 'income' | 'expense'): Promise<Category[]> {
    return this.repo.list(kind);
  }

  getById(id: string): Promise<Category | null> {
    return this.repo.getById(id);
  }

  create(input: NewCategory): Promise<Category> {
    return this.repo.create(input);
  }

  update(id: string, patch: Partial<NewCategory>): Promise<Category> {
    return this.repo.update(id, patch);
  }

  remove(id: string): Promise<void> {
    return this.repo.remove(id);
  }
}
