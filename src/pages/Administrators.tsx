
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdministratorsList } from "@/components/Administrators/AdministratorsList";
import { BidTypesList } from "@/components/Administrators/BidTypesList";
import { EntryTypesList } from "@/components/Administrators/EntryTypesList";
import { InstallmentTypesList } from "@/components/Administrators/InstallmentTypesList";
import { ProductsList } from "@/components/Administrators/ProductsList";
import { LeveragesList } from "@/components/Administrators/LeveragesList";
import { InstallmentReductionsList } from "@/components/Administrators/InstallmentReductionsList";

export default function Administrators() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Administradoras</h1>
        <p className="text-muted-foreground">
          Gerencie as administradoras e suas configurações
        </p>
      </div>

      <Tabs defaultValue="administrators" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="administrators">Administradoras</TabsTrigger>
          <TabsTrigger value="bid-types">Tipos de Lance</TabsTrigger>
          <TabsTrigger value="entry-types">Tipos de Entrada</TabsTrigger>
          <TabsTrigger value="installment-types">Tipos de Parcela</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="leverages">Alavancagens</TabsTrigger>
          <TabsTrigger value="reductions">Reduções</TabsTrigger>
        </TabsList>

        <TabsContent value="administrators">
          <Card>
            <CardHeader>
              <CardTitle>Administradoras</CardTitle>
              <CardDescription>
                Gerencie as administradoras do consórcio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdministratorsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bid-types">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Lance</CardTitle>
              <CardDescription>
                Configure os tipos de lance disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BidTypesList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entry-types">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Entrada</CardTitle>
              <CardDescription>
                Configure os tipos de entrada para os consórcios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EntryTypesList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installment-types">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Parcela</CardTitle>
              <CardDescription>
                Configure os tipos de parcelamento disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InstallmentTypesList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
              <CardDescription>
                Gerencie os produtos de consórcio disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leverages">
          <Card>
            <CardHeader>
              <CardTitle>Alavancagens</CardTitle>
              <CardDescription>
                Configure as opções de alavancagem patrimonial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeveragesList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reductions">
          <Card>
            <CardHeader>
              <CardTitle>Reduções de Parcela</CardTitle>
              <CardDescription>
                Configure as reduções aplicáveis às parcelas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InstallmentReductionsList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
