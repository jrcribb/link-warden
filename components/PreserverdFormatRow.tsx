import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import Link from "next/link";
import { useRouter } from "next/router";
import { useGetLink } from "@/hooks/store/links";

type Props = {
  name: string;
  icon: string;
  format: ArchivedFormat;
  link: LinkIncludingShortenedCollectionAndTags;
  downloadable?: boolean;
};

export default function PreservedFormatRow({
  name,
  icon,
  format,
  link,
  downloadable,
}: Props) {
  const getLink = useGetLink();

  const router = useRouter();

  let isPublic = router.pathname.startsWith("/public") ? true : undefined;

  const handleDownload = () => {
    const path = `/api/v1/archives/${link?.id}?format=${format}`;
    fetch(path)
      .then((response) => {
        if (response.ok) {
          // Create a temporary link and click it to trigger the download
          const anchorElement = document.createElement("a");
          anchorElement.href = path;
          anchorElement.download =
            format === ArchivedFormat.monolith
              ? "Webpage"
              : format === ArchivedFormat.pdf
                ? "PDF"
                : "Screenshot";
          anchorElement.click();
        } else {
          console.error("Failed to download file");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <div className="flex justify-between items-center pr-1 border border-neutral-content rounded-md">
      <div className="flex gap-2 items-center">
        <div className="bg-primary text-primary-content p-2 rounded-l-md">
          <i className={`${icon} text-2xl`} />
        </div>
        <p>{name}</p>
      </div>

      <div className="flex gap-1">
        {downloadable || false ? (
          <div
            onClick={() => handleDownload()}
            className="btn btn-sm btn-square"
          >
            <i className="bi-cloud-arrow-down text-xl text-neutral" />
          </div>
        ) : undefined}

        <Link
          href={`${
            isPublic ? "/public" : ""
          }/preserved/${link?.id}?format=${format}`}
          target="_blank"
          className="btn btn-sm btn-square"
        >
          <i className="bi-box-arrow-up-right text-xl text-neutral" />
        </Link>
      </div>
    </div>
  );
}
