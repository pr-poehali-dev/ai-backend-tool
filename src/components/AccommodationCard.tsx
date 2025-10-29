import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Photo {
  sm?: string;
  md?: string;
  lg?: string;
}

interface AccommodationItem {
  id: string | number;
  title?: string;
  name?: string;
  price?: number;
  full_address?: string;
  address?: string;
  location?: string;
  bedrooms?: number;
  rooms?: number;
  image?: string;
  images?: string[];
  photos?: Photo[];
  external_reviews_rating?: number;
  rating?: number;
  city?: string;
  guests?: number;
  bookingUrl?: string;
  [key: string]: any;
}

interface AccommodationCardProps {
  item: AccommodationItem;
}

export const AccommodationCard = ({ item }: AccommodationCardProps) => {
  const getBookingUrl = (id: string | number) => {
    console.log('[AccommodationCard] item.bookingUrl:', item.bookingUrl);
    console.log('[AccommodationCard] item.id:', item.id);
    
    // Если есть готовая ссылка из API - используем её
    if (item.bookingUrl) {
      return item.bookingUrl;
    }
    
    // Fallback на старую логику, если bookingUrl отсутствует
    const idStr = String(id);
    if (idStr.includes('hotels')) {
      return `https://qqrenta.ru/hotels/${idStr}`;
    }
    return `https://qqrenta.ru/rooms/${idStr}`;
  };

  const title = item.title || item.name || 'Без названия';
  
  const imageUrl = 
    item.image || 
    (item.images && item.images[0]) || 
    (item.photos && item.photos[0]?.sm) || 
    '';
  
  const location = item.full_address || item.address || item.location || '';
  const price = item.price || 0;
  const rating = item.external_reviews_rating || item.rating || 0;
  const rooms = item.bedrooms || item.rooms || 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EФото%3C/text%3E%3C/svg%3E';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="Home" size={48} className="text-muted-foreground" />
          </div>
        )}
        {rating > 0 && (
          <Badge className="absolute top-2 right-2 bg-white/90 text-foreground">
            <Icon name="Star" size={12} className="mr-1 fill-yellow-400 text-yellow-400" />
            {rating.toFixed(1)}
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{title}</h3>
        
        {location && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
            <Icon name="MapPin" size={16} className="mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{location}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex flex-col">
            {price > 0 && (
              <div className="text-2xl font-bold">{price.toLocaleString('ru-RU')} ₽</div>
            )}
            {rooms > 0 && (
              <div className="text-xs text-muted-foreground">
                {rooms} {rooms === 1 ? 'комната' : 'комнаты'}
              </div>
            )}
          </div>
          <Button asChild>
            <a href={getBookingUrl(item.id)} target="_blank" rel="noopener noreferrer">
              Посмотреть
              <Icon name="ExternalLink" size={14} className="ml-2" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};