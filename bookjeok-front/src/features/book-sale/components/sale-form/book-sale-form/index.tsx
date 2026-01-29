import { BookOpen, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { BookSearchModal } from "@/features/book/components/common/book-search-modal";
import { MapLocationSelector } from "@/shared/components/map/map-location-selector";
import { Button } from "@/shared/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { Input } from "@/shared/components/shadcn/input";
import { Textarea } from "@/shared/components/shadcn/textarea";
import { ImageUploader } from "@/shared/components/ui/image-uploader";
import { LocationSelector } from "@/shared/components/ui/location-selector";

import { useBookSaleForm } from "../../../hooks/use-book-sale-form";

export const BookSaleForm = () => {
  const t = useTranslations("market.form");
  const {
    form,
    imagePreviews,
    isSubmitDisabled,
    selectedBook,
    setSelectedBook,
    handleImagesAdd,
    handleImageRemove,
    onSubmit,
  } = useBookSaleForm();

  return (
    <Card className="w-full border-none shadow-none sm:border sm:shadow-sm">
      <CardHeader className="px-0 sm:px-6">
        <CardTitle className="text-2xl">{t("title_write")}</CardTitle>
        <CardDescription>{t("desc_write")}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-8">
            <fieldset disabled={isSubmitDisabled} className="space-y-8">
              <FormField
                control={form.control}
                name="book"
                render={() => (
                  <>
                    <FormLabel>{t("book.label")}</FormLabel>
                    <FormItem>
                      {!selectedBook ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 mb-2 border-2 border-dashed rounded-xl bg-muted/30 gap-6 hover:bg-muted/50 transition-colors group">
                          <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <BookOpen className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div className="text-center space-y-2">
                            <h3 className="font-semibold text-lg">
                              {t("book.empty_title")}
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                              {t("book.empty_desc")}
                            </p>
                          </div>
                          <BookSearchModal
                            onSelect={setSelectedBook}
                            trigger={
                              <Button size="lg" className="px-8 font-semibold">
                                {t("book.search")}
                              </Button>
                            }
                          />
                        </div>
                      ) : (
                        <div className="relative flex flex-col sm:flex-row items-start sm:items-center p-6 mb-2 border rounded-xl bg-card shadow-sm gap-6 group overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                          <div className="relative w-24 h-36 shrink-0 rounded-lg overflow-hidden shadow-md">
                            <Image
                              src={selectedBook.image}
                              alt={selectedBook.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="space-y-1">
                              <h3 className="font-bold text-xl leading-tight text-foreground">
                                {selectedBook.title}
                              </h3>
                              <p className="text-muted-foreground">
                                {selectedBook.author}{" "}
                                <span className="mx-1">·</span>{" "}
                                {selectedBook.publisher}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                              <BookSearchModal
                                onSelect={setSelectedBook}
                                trigger={
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                  >
                                    {t("book.change")}
                                  </Button>
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="mt-1 min-h-5">
                        <FormMessage />
                      </div>
                    </FormItem>
                  </>
                )}
              />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fields.title")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("fields.title_placeholder")}
                          {...field}
                        />
                      </FormControl>
                      <div className="mt-1 min-h-5">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fields.price")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={t("fields.price_placeholder")}
                          {...field}
                        />
                      </FormControl>
                      <div className="mt-1 min-h-5">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="border rounded-xl p-4 sm:p-6 bg-muted/20 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">
                    {t("fields.location_title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("fields.location_desc")}
                  </p>
                </div>
                <MapLocationSelector
                  onLocationSelect={(lat, lng, addressInfo) => {
                    form.setValue("latitude", lat);
                    form.setValue("longitude", lng);

                    if (addressInfo) {
                      if (addressInfo.placeName) {
                        form.setValue("placeName", addressInfo.placeName);
                      } else {
                        form.setValue("placeName", "");
                      }
                    } else {
                      if (!addressInfo && (lat !== 0 || lng !== 0)) {
                        toast.error(t("error_location"));
                      }
                      form.setValue("placeName", "");
                    }
                  }}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="md:col-span-2 space-y-2">
                    <LocationSelector
                      className="bg-background"
                      city={form.watch("city")}
                      district={form.watch("district")}
                      onCityChange={(value) => {
                        form.setValue("city", value, { shouldValidate: true });
                        form.setValue("district", "", { shouldValidate: true });
                      }}
                      onDistrictChange={(value) => {
                        form.setValue("district", value, {
                          shouldValidate: true,
                        });
                      }}
                    />
                    <div className="flex gap-4">
                      <div className="flex-1 min-h-5">
                        {form.formState.errors.city && (
                          <p className="text-sm font-medium text-destructive">
                            {form.formState.errors.city.message}
                          </p>
                        )}
                      </div>
                      <div className="flex-1 min-h-5">
                        {form.formState.errors.district && (
                          <p className="text-sm font-medium text-destructive">
                            {form.formState.errors.district.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="placeName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t("fields.location_name")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("fields.location_name_placeholder")}
                            className="bg-background"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="images"
                render={() => (
                  <FormItem>
                    <FormLabel>
                      {`${t("fields.images")} (${imagePreviews.length} / 5)`}
                    </FormLabel>
                    <FormControl>
                      <ImageUploader
                        previews={imagePreviews}
                        onImagesAdd={handleImagesAdd}
                        onImageRemove={handleImageRemove}
                        maxFiles={5}
                      />
                    </FormControl>
                    <div className="mt-1 min-h-5">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.content")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("fields.content_placeholder")}
                        className="resize-none"
                        rows={8}
                        {...field}
                      />
                    </FormControl>
                    <div className="mt-1 min-h-5">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </fieldset>

            <Button
              type="submit"
              className="w-full mt-10!"
              disabled={isSubmitDisabled}
            >
              {isSubmitDisabled && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("submit")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
