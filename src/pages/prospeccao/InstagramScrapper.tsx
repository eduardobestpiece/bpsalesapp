import { ProspeccaoLayout } from '@/components/Layout/ProspeccaoLayout';
import { InstagramExtrator } from '@/components/Prospeccao/InstagramExtrator';

export default function InstagramScrapper() {
  return (
    <ProspeccaoLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Instagram Scrapper</h1>
          <p className="text-muted-foreground mt-2">
            Extraia informações de perfis do Instagram de forma automatizada.
          </p>
        </div>

        <InstagramExtrator />
      </div>
    </ProspeccaoLayout>
  );
}
