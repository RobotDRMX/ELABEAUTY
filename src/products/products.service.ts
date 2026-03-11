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
  ) { }

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
      maxPrice,
      onlyInStock,
      targetAge
    } = searchDto;

    const skip = (page - 1) * limit;

    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .where('product.is_active = :isActive', { isActive: true });

    if (query) {
      queryBuilder.andWhere(
        '(product.name LIKE :query OR product.description LIKE :query OR product.category LIKE :query OR product.subcategory LIKE :query)',
        { query: `%${query}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere('product.category = :category', { category });
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (onlyInStock) {
      queryBuilder.andWhere('product.stock > 0');
    }

    if (targetAge) {
      queryBuilder.andWhere('product.target_age = :targetAge', { targetAge });
    }

    const total = await queryBuilder.getCount();

    const ALLOWED_SORT_COLUMNS = ['name', 'price', 'rating', 'created_at', 'stock'];
    const safeSortBy = ALLOWED_SORT_COLUMNS.includes(sortBy ?? '') ? sortBy : 'created_at';

    const products = await queryBuilder
      .orderBy(`product.${safeSortBy}`, order)
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
        name: 'SuperStay Matte Ink',
        description: 'Labial líquido mate de larga duración, hasta 16 horas de color intenso.',
        price: 249.00,
        category: 'Labiales',
        subcategory: 'Líquidos',
        stock: 50,
        image_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600',
        rating: 4.8,
        review_count: 1250,
        target_age: 'Todas'
      },
      {
        name: 'Sky High Mascara',
        description: 'Pestañas con un volumen redefinido y longitud sin límites.',
        price: 199.00,
        category: 'Ojos',
        subcategory: 'Máscaras',
        stock: 75,
        image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
        rating: 4.9,
        review_count: 850,
        target_age: 'Jóvenes'
      },
      {
        name: 'Fit Me Foundation',
        description: 'Base de maquillaje que matifica y refina los poros. Cobertura natural.',
        price: 299.00,
        category: 'Rostro',
        subcategory: 'Bases',
        stock: 40,
        image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600',
        rating: 4.7,
        review_count: 2100,
        target_age: 'Todas'
      },
      {
        name: 'Instant Age Rewind',
        description: 'Corrector de tratamiento súper concentrado que borra ojeras y bolsas.',
        price: 189.00,
        category: 'Rostro',
        subcategory: 'Correctores',
        stock: 60,
        image_url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600',
        rating: 4.9,
        review_count: 3400,
        target_age: 'Adultos'
      },
      {
        name: 'Baby Lips Lip Balm',
        description: 'Bálsamo labial hidratante para labios suaves como los de un bebé.',
        price: 79.00,
        category: 'Labiales',
        subcategory: 'Bálsamos',
        stock: 120,
        image_url: 'https://images.unsplash.com/photo-1599733594230-6b823276abcc?w=600',
        rating: 4.5,
        review_count: 500,
        target_age: 'Adolescentes'
      },
      {
        name: 'Master Chrome Highlighter',
        description: 'Iluminador metálico para un brillo radiante y efecto cromo.',
        price: 219.00,
        category: 'Rostro',
        subcategory: 'Iluminadores',
        stock: 0,
        image_url: 'https://images.unsplash.com/photo-1557204988-21d496015851?w=600',
        rating: 4.6,
        review_count: 320,
        target_age: 'Jóvenes'
      },
      {
        name: 'Lifter Gloss with Hyaluronic Acid',
        description: 'Brillo labial que hidrata y da una apariencia de labios más carnosos.',
        price: 239.00,
        category: 'Labiales',
        subcategory: 'Gloss',
        stock: 35,
        image_url: 'https://images.unsplash.com/photo-1599305090598-fe179d501c27?w=600',
        rating: 4.8,
        review_count: 890,
        target_age: 'Todas'
      },
      {
        name: 'Brow Fast Sculpt',
        description: 'Gel con color para cejas, peina y rellena en un solo paso.',
        price: 159.00,
        category: 'Ojos',
        subcategory: 'Cejas',
        stock: 45,
        image_url: 'https://images.unsplash.com/photo-1591360236630-4e9432657e2d?w=600',
        rating: 4.4,
        review_count: 210,
        target_age: 'Todas'
      }
    ];

    for (const productData of products) {
      let product = await this.productsRepository.findOne({
        where: { name: productData.name },
      });

      if (!product) {
        await this.create(productData as CreateProductDto);
      } else {
        // Actualizar datos si ya existe para asegurar que el seed tenga todo lo nuevo
        Object.assign(product, productData);
        await this.productsRepository.save(product);
      }
    }
  }
}
