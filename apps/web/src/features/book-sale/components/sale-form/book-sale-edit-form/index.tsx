import { UsedBookSale } from "@bookjeok/core";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";

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

import { useBookSaleEditForm } from "../../../hooks/use-book-sale-edit-form";
import { UploadProgressModal } from "../../common/upload-progress-modal";
import { RegionDisplayCard } from "../region-display-card";

// 카카오맵 SDK가 무거우므로 지연 로딩
const MapLocationSelector = dynamic(
  () =>
    import("@/shared/components/map/map-location-selector").then(
      (mod) => mod.MapLocationSelector,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] rounded-lg animate-pulse bg-muted/30" />
    ),
  },
);

interface BookSaleEditFormProps {
  sale: UsedBookSale;
}

export const BookSaleEditForm = ({ sale }: BookSaleEditFormProps) => {
  const t = useTranslations("market.form");
  const {
    form,
    existingImages,
    newImagePreviews,
    isSubmitDisabled,
    handleImagesAdd,
    handleExistingImageRemove,
    handleNewImageRemove,
    uploadStep,
    uploadProgress,
    isModalOpen,
    onSubmit,
  } = useBookSaleEditForm({ sale });

  const totalImages = existingImages.length + newImagePreviews.length;

  return (
    <Card className="w-full border-none shadow-none sm:border sm:border-stone-200/90 dark:sm:border-stone-800 sm:shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:sm:shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
      <CardHeader>
        <CardTitle className="text-2xl">{t("title_edit")}</CardTitle>
        <CardDescription>{t("desc_edit")}</CardDescription>
      </CardHeader>
      <CardContent>
        <label className="font-medium text-gray-900 text-sm">
          {t("book.label")}
        </label>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center p-6 mb-8 border rounded-xl bg-card shadow-sm gap-6 group overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <div className="relative w-24 h-36 shrink-0 rounded-lg overflow-hidden shadow-md">
            <Image
              src={sale.book.image}
              alt={sale.book.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="space-y-1">
              <h3 className="font-bold text-xl leading-tight text-foreground">
                {sale.book.title}
              </h3>
              <p className="text-muted-foreground">
                {sale.book.author} <span className="mx-1">·</span>{" "}
                {sale.book.publisher}
              </p>
            </div>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            <fieldset disabled={isSubmitDisabled} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>{t("fields.title")}</FormLabel>
                        <span className="text-xs text-muted-foreground">
                          {field.value?.length || 0} / 50자
                        </span>
                      </div>
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
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                            ₩
                          </span>
                          <Input
                            type="number"
                            placeholder={t("fields.price_placeholder")}
                            className="pl-8"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <div className="mt-1 min-h-5">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6">
                <div className="border rounded-xl p-4 sm:p-6 bg-muted/20 space-y-4 col-span-1 md:col-span-2">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-base">
                      {t("fields.location_title")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("fields.location_desc")}
                    </p>
                  </div>

                  <MapLocationSelector
                    defaultLat={sale.latitude ?? undefined}
                    defaultLng={sale.longitude ?? undefined}
                    onLocationSelect={(lat, lng, addressInfo) => {
                      form.setValue("latitude", lat);
                      form.setValue("longitude", lng);

                      if (addressInfo) {
                        if (addressInfo.city) {
                          form.setValue("city", addressInfo.city, {
                            shouldValidate: true,
                          });
                        }
                        if (addressInfo.district) {
                          form.setValue("district", addressInfo.district, {
                            shouldValidate: true,
                          });
                        }
                        if (addressInfo.placeName) {
                          form.setValue("placeName", addressInfo.placeName);
                        } else {
                          form.setValue("placeName", "");
                        }
                      }
                    }}
                  />

                <RegionDisplayCard
                  city={form.watch("city")}
                  district={form.watch("district")}
                  placeName={form.watch("placeName")}
                  error={
                    form.formState.errors.city?.message ||
                    form.formState.errors.district?.message
                  }
                />

                    <FormField
                      control={form.control}
                      name="placeName"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>{t("fields.location_name")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                "fields.location_name_placeholder",
                              )}
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
                    <FormLabel>{`${t("fields.images")} (${totalImages} / 5)`}</FormLabel>
                    <FormControl>
                      <ImageUploader
                        previews={newImagePreviews}
                        existingImages={existingImages}
                        onImagesAdd={handleImagesAdd}
                        onImageRemove={handleNewImageRemove}
                        onExistingImageRemove={handleExistingImageRemove}
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
                    <div className="flex items-center justify-between">
                      <FormLabel>{t("fields.content")}</FormLabel>
                      <span className="text-xs text-muted-foreground">
                        {field.value?.length || 0} / 1000자
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        "#책 상태 최상",
                        "#직거래 선호",
                        "#택배 거래 가능",
                        "#밑줄/필기 없음",
                        "#네고 불가",
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const currentContent = form.getValues("content") || "";
                            if (!currentContent.includes(tag)) {
                              form.setValue(
                                "content",
                                currentContent ? `${currentContent}\n${tag}` : tag,
                                { shouldValidate: true },
                              );
                            }
                          }}
                          className="text-xs px-2.5 py-1 rounded-md border border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-800/50 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>

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
              {t("submit_edit")}
            </Button>
          </form>
        </Form>
        <UploadProgressModal
          open={isModalOpen}
          step={uploadStep}
          progress={uploadProgress}
          isEdit={true}
        />
      </CardContent>
    </Card>
  );
};
