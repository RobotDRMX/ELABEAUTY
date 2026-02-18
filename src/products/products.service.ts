import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductDto } from './dto/search-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create(createProductDto);
    return await this.productsRepository.save(product);
  }

  async search(searchDto: SearchProductDto): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { 
      query, 
      category, 
      page = 1, 
      limit = 10, 
      sortBy = 'created_at', 
      order = 'DESC',
      minPrice,
      maxPrice
    } = searchDto;

    const skip = (page - 1) * limit;

    // Construir query base
    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .where('product.is_active = :isActive', { isActive: true });

    // Aplicar búsqueda por texto (MySQL usa LIKE que es case-insensitive por defecto)
    if (query) {
      queryBuilder.andWhere(
        '(product.name LIKE :query OR product.description LIKE :query OR product.category LIKE :query OR product.subcategory LIKE :query)',
        { query: `%${query}%` }
      );
    }

    // Filtro por categoría
    if (category) {
      queryBuilder.andWhere('product.category = :category', { category });
    }

    // Filtro por rango de precios
    if (minPrice !== undefined && maxPrice !== undefined) {
      queryBuilder.andWhere('product.price BETWEEN :minPrice AND :maxPrice', {
        minPrice,
        maxPrice
      });
    } else if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    } else if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Obtener total antes de paginar
    const total = await queryBuilder.getCount();

    // Aplicar paginación y ordenamiento
    const products = await queryBuilder
      .orderBy(`product.${sortBy}`, order)
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, is_active: true },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  async getCategories(): Promise<string[]> {
    const categories = await this.productsRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.category', 'category')
      .where('product.is_active = :isActive', { isActive: true })
      .orderBy('product.category', 'ASC')
      .getRawMany();

    return categories.map(cat => cat.category);
  }

  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    return await this.productsRepository.find({
      where: { is_active: true },
      order: { rating: 'DESC', created_at: 'DESC' },
      take: limit,
    });
  }

  async seedProducts(): Promise<void> {
    const products = [
      {
        name: 'Labial Líquido Mate SuperStay',
        description: 'Labial líquido de larga duración 24h, acabado mate',
        price: 249.00,
        category: 'Labiales',
        subcategory: 'Líquidos',
        stock: 50,
        image_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400',
        rating: 4.8,
        review_count: 125,
      },
      {
        name: 'Máscara de Pestañas The Falsies',
        description: 'Máscara de pestañas volumen extremo, efecto pestañas postizas',
        price: 199.00,
        category: 'Ojos',
        subcategory: 'Máscaras',
        stock: 75,
        image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
        rating: 4.6,
        review_count: 89,
      },
      {
        name: 'Base de Maquillaje Fit Me',
        description: 'Base de maquillaje mate natural, cobertura media',
        price: 299.00,
        category: 'Rostro',
        subcategory: 'Bases',
        stock: 40,
        image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400',
        rating: 4.7,
        review_count: 156,
      },
      {
        name: 'Rubor Dream Matte',
        description: 'Rubor en polvo mate de larga duración',
        price: 179.00,
        category: 'Rostro',
        subcategory: 'Rubores',
        stock: 60,
        image_url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400',
        rating: 4.5,
        review_count: 92,
      },
      {
        name: 'Esmalte de Uñas Express Finish',
        description: 'Esmalte de uñas secado rápido, acabado brillante',
        price: 89.00,
        category: 'Uñas',
        subcategory: 'Esmaltes',
        stock: 100,
        image_url: 'https://images.unsplash.com/photo-1519415387722-a1c3bbef716c?w=400',
        rating: 4.4,
        review_count: 78,
      },
    ];

    for (const productData of products) {
      const exists = await this.productsRepository.findOne({
        where: { name: productData.name },
      });

      if (!exists) {
        await this.create(productData as CreateProductDto);
      }
    }
  }
}
