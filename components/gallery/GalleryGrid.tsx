 'use client';

 import { useMemo, useState } from 'react';
 import Image from 'next/image';
 import { Badge, Icon, Modal } from '@/components/ui';

 export interface GalleryImage {
   id: string;
   src: string;
   alt: string;
   title: string;
   category: string;
   description: string;
   featured?: boolean;
   order?: number;
 }

 export interface GalleryCategory {
   id: string;
   name: string;
   icon: string;
   description?: string;
 }

 interface GalleryGridProps {
   images: GalleryImage[];
   categories: GalleryCategory[];
 }

 export default function GalleryGrid({ images, categories }: GalleryGridProps) {
   const [activeCategory, setActiveCategory] = useState<string>('all');
   const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

   const sortedImages = useMemo(() => {
     return [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
   }, [images]);

   const filteredImages = activeCategory === 'all'
     ? sortedImages
     : sortedImages.filter((img) => img.category === activeCategory);

   const getCategoryCount = (categoryId: string) => {
     if (categoryId === 'all') {
       return sortedImages.length;
     }
     return sortedImages.filter((img) => img.category === categoryId).length;
   };

   return (
     <>
       {/* Category Filters */}
       <div className="mb-8">
         <div className="flex flex-wrap gap-2 justify-center">
           {categories.map((category) => {
             const isActive = activeCategory === category.id;
             return (
               <button
                 key={category.id}
                 onClick={() => setActiveCategory(category.id)}
                 className={`px-4 py-2 rounded-lg text-small font-semibold transition-colors flex items-center gap-2 ${
                   isActive
                     ? 'bg-primary text-white'
                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                 }`}
               >
                 <Icon name={category.icon as any} size="sm" />
                 {category.name} ({getCategoryCount(category.id)})
               </button>
             );
           })}
         </div>
       </div>

       {/* Image Grid */}
       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredImages.map((image) => (
           <div
             key={image.id}
             onClick={() => setSelectedImage(image)}
             className="group cursor-pointer bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary hover:shadow-xl transition-all duration-300"
           >
             <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
               <Image
                 src={image.src}
                 alt={image.alt}
                 fill
                 className="object-cover group-hover:scale-105 transition-transform duration-500"
               />
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                 <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-semibold bg-primary px-4 py-2 rounded-lg">
                   View Photo
                 </span>
               </div>
             </div>

             <div className="p-4">
               <p className="text-gray-900 font-medium mb-2 group-hover:text-primary transition-colors">
                 {image.title}
               </p>
               <Badge variant="secondary" size="sm">
                 {categories.find(cat => cat.id === image.category)?.name ?? image.category}
               </Badge>
             </div>
           </div>
         ))}
       </div>

       {filteredImages.length === 0 && (
         <div className="text-center py-12">
           <Icon name="Image" size="xl" className="text-gray-300 mx-auto mb-4" />
           <p className="text-gray-500">No images in this category yet.</p>
         </div>
       )}

       {/* Lightbox Modal */}
      {selectedImage && (
         <Modal open={!!selectedImage} onClose={() => setSelectedImage(null)} size="full">
           <div className="relative w-full h-full flex items-center justify-center p-4">
             <div className="max-w-6xl max-h-[85vh] w-full">
               <div className="relative w-full aspect-[16/10] bg-black/80 rounded-lg overflow-hidden">
                 <Image
                   src={selectedImage.src}
                   alt={selectedImage.alt}
                   fill
                   className="object-contain"
                 />
               </div>

               <div className="mt-6 text-center">
                 <h3 className="text-2xl font-bold text-white mb-2">
                   {selectedImage.title}
                 </h3>
                 <p className="text-white/80 mb-2">
                   {selectedImage.description}
                 </p>
                 <Badge variant="secondary" size="sm">
                   {categories.find(cat => cat.id === selectedImage.category)?.name ?? selectedImage.category}
                 </Badge>
               </div>
             </div>
           </div>
         </Modal>
      )}
    </>
  );
}
