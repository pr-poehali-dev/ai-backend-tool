import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';

interface Database {
  id: string;
  name: string;
  createDate: string;
  filesCount?: number;
}

interface DatabaseTabProps {
  databases: Database[];
  isLoading: boolean;
  onCreateDatabase: () => void;
  onViewDatabase: (database: Database) => void;
}

export const DatabaseTab = ({
  databases,
  isLoading,
  onCreateDatabase,
  onViewDatabase,
}: DatabaseTabProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-64 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Векторные базы данных (RAG)</h2>
          <p className="text-muted-foreground">Управление базами знаний для AI ассистентов</p>
        </div>
        <Button onClick={onCreateDatabase}>
          <Icon name="Plus" size={16} className="mr-2" />
          Создать базу
        </Button>
      </div>

      {databases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Icon name="Database" size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Нет баз данных</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Создайте векторную базу данных для хранения документов, текстов и других источников знаний для AI
            </p>
            <Button onClick={onCreateDatabase}>
              <Icon name="Plus" size={16} className="mr-2" />
              Создать первую базу
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {databases.map((database) => (
            <Card key={database.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="Database" size={20} />
                    <CardTitle className="text-lg">{database.name}</CardTitle>
                  </div>
                  <Badge variant="secondary">{database.filesCount || 0} файлов</Badge>
                </div>
                <CardDescription>
                  Создано: {new Date(database.createDate).toLocaleDateString('ru-RU')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onViewDatabase(database)}
                >
                  <Icon name="FolderOpen" size={14} className="mr-2" />
                  Открыть
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};