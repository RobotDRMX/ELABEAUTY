import { LucideAngularModule } from 'lucide-angular';
import {
  Heart, Star, Search, X, ArrowRight, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Eye, Palette, Sparkles, Moon, Circle,
  Award, Leaf, Truck, Tag, ShieldCheck, Shield, Grid2x2, Phone, HelpCircle,
  ArrowLeftRight, Ruler, Info, Store, BookOpen, Crown, FileText,
  Scissors, Clock, TriangleAlert, CircleAlert, ListOrdered,
  CalendarCheck, ShoppingBag, Send, Code, Home, Box, Paintbrush,
  Users, Plus, Pencil, ToggleLeft, ToggleRight, Trash2, CircleUser,
  UserCog, Sparkle, LogOut, Sun, Flower2,
} from 'lucide-angular';

/**
 * ModuleWithProviders — register once in app.config.ts via importProvidersFrom().
 * This sets up the icon registry globally so all components can use <lucide-icon>.
 */
export const LucideIconsModule = LucideAngularModule.pick({
  Heart, Star, Search, X, ArrowRight, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Eye, Palette, Sparkles, Moon, Circle,
  Award, Leaf, Truck, Tag, ShieldCheck, Shield, Grid2x2, Phone, HelpCircle,
  ArrowLeftRight, Ruler, Info, Store, BookOpen, Crown, FileText,
  Scissors, Clock, TriangleAlert, CircleAlert, ListOrdered,
  CalendarCheck, ShoppingBag, Send, Code, Home, Box, Paintbrush,
  Users, Plus, Pencil, ToggleLeft, ToggleRight, Trash2, CircleUser,
  UserCog, Sparkle, LogOut, Sun, Flower2,
});

/**
 * Bare module class for standalone component imports.
 * Icons are already registered globally — this just makes <lucide-icon> available in templates.
 *
 *   imports: [LucideIcons]
 *
 * Template usage:
 *   <lucide-icon name="heart" [size]="18"></lucide-icon>
 */
export const LucideIcons = LucideAngularModule;
