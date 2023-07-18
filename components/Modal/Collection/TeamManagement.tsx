import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faCrown,
  faPenToSquare,
  faPlus,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import useCollectionStore from "@/store/collections";
import { CollectionIncludingMembersAndLinkCount, Member } from "@/types/global";
import { useSession } from "next-auth/react";
import addMemberToCollection from "@/lib/client/addMemberToCollection";
import Checkbox from "../../Checkbox";
import SubmitButton from "@/components/SubmitButton";
import ProfilePhoto from "@/components/ProfilePhoto";
import usePermissions from "@/hooks/usePermissions";
import { toast } from "react-hot-toast";
import getPublicUserData from "@/lib/client/getPublicUserData";

type Props = {
  toggleCollectionModal: Function;
  setCollection: Dispatch<
    SetStateAction<CollectionIncludingMembersAndLinkCount>
  >;
  collection: CollectionIncludingMembersAndLinkCount;
  method: "CREATE" | "UPDATE";
};

export default function TeamManagement({
  toggleCollectionModal,
  setCollection,
  collection,
  method,
}: Props) {
  const permissions = usePermissions(collection.id as number);

  const currentURL = new URL(document.URL);

  const publicCollectionURL = `${currentURL.origin}/public/collections/${collection.id}`;

  const [member, setMember] = useState<Member>({
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    user: {
      name: "",
      username: "",
    },
  });

  const [collectionOwner, setCollectionOwner] = useState({
    id: null,
    name: "",
    username: "",
  });

  useEffect(() => {
    const fetchOwner = async () => {
      const owner = await getPublicUserData({ id: collection.ownerId });
      setCollectionOwner(owner);
    };

    fetchOwner();
  }, []);

  const { addCollection, updateCollection } = useCollectionStore();

  const session = useSession();

  const setMemberState = (newMember: Member) => {
    if (!collection) return null;

    setCollection({
      ...collection,
      members: [...collection.members, newMember],
    });

    setMember({
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      user: {
        name: "",
        username: "",
      },
    });
  };

  const [submitLoader, setSubmitLoader] = useState(false);

  const submit = async () => {
    if (!collection) return null;

    setSubmitLoader(true);

    const load = toast.loading(
      method === "UPDATE" ? "Applying..." : "Creating..."
    );

    let response;

    if (method === "CREATE") response = await addCollection(collection);
    else response = await updateCollection(collection);

    toast.dismiss(load);

    if (response.ok) {
      toast.success("Collection Saved!");
      toggleCollectionModal();
    } else toast.error(response.data as string);

    setSubmitLoader(false);
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      {permissions === true && (
        <>
          <p className="text-sm text-sky-500">Make Public</p>

          <Checkbox
            label="Make this a public collection."
            state={collection.isPublic}
            onClick={() =>
              setCollection({ ...collection, isPublic: !collection.isPublic })
            }
          />

          <p className="text-gray-500 text-sm">
            This will let <b>Anyone</b> to view this collection.
          </p>
        </>
      )}

      {collection.isPublic ? (
        <div>
          <p className="text-sm text-sky-500 mb-2">
            Public Link (Click to copy)
          </p>
          <div
            onClick={() => {
              try {
                navigator.clipboard
                  .writeText(publicCollectionURL)
                  .then(() => toast.success("Copied!"));
              } catch (err) {
                console.log(err);
              }
            }}
            className="w-full hide-scrollbar overflow-x-auto whitespace-nowrap rounded-md p-3 border-sky-100 border-solid border outline-none hover:border-sky-500 duration-100 cursor-text"
          >
            {publicCollectionURL}
          </div>
        </div>
      ) : null}

      {permissions !== true && collection.isPublic && <hr />}

      {permissions === true && (
        <>
          <p className="text-sm text-sky-500">Member Management</p>

          <div className="flex items-center gap-2">
            <input
              value={member.user.username}
              onChange={(e) => {
                setMember({
                  ...member,
                  user: { ...member.user, username: e.target.value },
                });
              }}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                addMemberToCollection(
                  session.data?.user.username as string,
                  member.user.username,
                  collection,
                  setMemberState
                )
              }
              type="text"
              placeholder="Username (without the '@')"
              className="w-full rounded-md p-3 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
            />

            <div
              onClick={() =>
                addMemberToCollection(
                  session.data?.user.username as string,
                  member.user.username,
                  collection,
                  setMemberState
                )
              }
              className="flex items-center justify-center bg-sky-500 hover:bg-sky-400 duration-100 text-white w-12 h-12 p-3 rounded-md cursor-pointer"
            >
              <FontAwesomeIcon icon={faUserPlus} className="w-5 h-5" />
            </div>
          </div>
        </>
      )}

      {collection?.members[0]?.user && (
        <>
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            (All Members have <b>Read</b> access to this collection.)
          </p>
          <div className="max-h-[20rem] overflow-auto flex flex-col gap-3 rounded-md">
            {collection.members
              .sort((a, b) => (a.userId as number) - (b.userId as number))
              .map((e, i) => {
                return (
                  <div
                    key={i}
                    className="relative border p-2 rounded-md border-sky-100 flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
                  >
                    {permissions === true && (
                      <FontAwesomeIcon
                        icon={faClose}
                        className="absolute right-2 top-2 text-gray-500 h-4 hover:text-red-500 duration-100 cursor-pointer"
                        title="Remove Member"
                        onClick={() => {
                          const updatedMembers = collection.members.filter(
                            (member) => {
                              return member.user.username !== e.user.username;
                            }
                          );
                          setCollection({
                            ...collection,
                            members: updatedMembers,
                          });
                        }}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <ProfilePhoto
                        src={`/api/avatar/${e.userId}`}
                        className="border-[3px]"
                      />
                      <div>
                        <p className="text-sm font-bold text-sky-500">
                          {e.user.name}
                        </p>
                        <p className="text-sky-900">@{e.user.username}</p>
                      </div>
                    </div>
                    <div className="flex sm:block items-center gap-5 min-w-[10rem]">
                      <div>
                        <p
                          className={`font-bold text-sm text-sky-500 ${
                            permissions === true ? "" : "mb-2"
                          }`}
                        >
                          Permissions
                        </p>
                        {permissions === true && (
                          <p className="text-xs text-gray-500 mb-2">
                            (Click to toggle.)
                          </p>
                        )}
                      </div>

                      {permissions !== true &&
                      !e.canCreate &&
                      !e.canUpdate &&
                      !e.canDelete ? (
                        <p className="text-sm text-gray-500">
                          Has no permissions.
                        </p>
                      ) : (
                        <div>
                          <label
                            className={
                              permissions === true
                                ? "cursor-pointer mr-1"
                                : "mr-1"
                            }
                          >
                            <input
                              type="checkbox"
                              id="canCreate"
                              className="peer sr-only"
                              checked={e.canCreate}
                              onChange={() => {
                                if (permissions === true) {
                                  const updatedMembers = collection.members.map(
                                    (member) => {
                                      if (
                                        member.user.username === e.user.username
                                      ) {
                                        return {
                                          ...member,
                                          canCreate: !e.canCreate,
                                        };
                                      }
                                      return member;
                                    }
                                  );
                                  setCollection({
                                    ...collection,
                                    members: updatedMembers,
                                  });
                                }
                              }}
                            />
                            <span
                              className={`text-sky-900 peer-checked:bg-sky-500 text-sm ${
                                permissions === true
                                  ? "hover:bg-slate-200 duration-75"
                                  : ""
                              } peer-checked:text-white rounded p-1 select-none`}
                            >
                              Create
                            </span>
                          </label>

                          <label
                            className={
                              permissions === true
                                ? "cursor-pointer mr-1"
                                : "mr-1"
                            }
                          >
                            <input
                              type="checkbox"
                              id="canUpdate"
                              className="peer sr-only"
                              checked={e.canUpdate}
                              onChange={() => {
                                if (permissions === true) {
                                  const updatedMembers = collection.members.map(
                                    (member) => {
                                      if (
                                        member.user.username === e.user.username
                                      ) {
                                        return {
                                          ...member,
                                          canUpdate: !e.canUpdate,
                                        };
                                      }
                                      return member;
                                    }
                                  );
                                  setCollection({
                                    ...collection,
                                    members: updatedMembers,
                                  });
                                }
                              }}
                            />
                            <span
                              className={`text-sky-900 peer-checked:bg-sky-500 text-sm ${
                                permissions === true
                                  ? "hover:bg-slate-200 duration-75"
                                  : ""
                              } peer-checked:text-white rounded p-1 select-none`}
                            >
                              Update
                            </span>
                          </label>

                          <label
                            className={
                              permissions === true
                                ? "cursor-pointer mr-1"
                                : "mr-1"
                            }
                          >
                            <input
                              type="checkbox"
                              id="canDelete"
                              className="peer sr-only"
                              checked={e.canDelete}
                              onChange={() => {
                                if (permissions === true) {
                                  const updatedMembers = collection.members.map(
                                    (member) => {
                                      if (
                                        member.user.username === e.user.username
                                      ) {
                                        return {
                                          ...member,
                                          canDelete: !e.canDelete,
                                        };
                                      }
                                      return member;
                                    }
                                  );
                                  setCollection({
                                    ...collection,
                                    members: updatedMembers,
                                  });
                                }
                              }}
                            />
                            <span
                              className={`text-sky-900 peer-checked:bg-sky-500 text-sm ${
                                permissions === true
                                  ? "hover:bg-slate-200 duration-75"
                                  : ""
                              } peer-checked:text-white rounded p-1 select-none`}
                            >
                              Delete
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}

      <div
        className="relative border p-2 rounded-md border-sky-100 flex flex-col gap-2 justify-between"
        title={`'@${collectionOwner.username}' is the owner of this collection.`}
      >
        <div className="flex items-center gap-2">
          <ProfilePhoto
            src={`/api/avatar/${collection.ownerId}`}
            className="border-[3px]"
          />
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-sky-500">
                {collectionOwner.name}
              </p>
              <FontAwesomeIcon
                icon={faCrown}
                className="w-3 h-3 text-yellow-500"
              />
            </div>
            <p className="text-sky-900">@{collectionOwner.username}</p>
          </div>
        </div>
      </div>

      {permissions === true && (
        <SubmitButton
          onClick={submit}
          loading={submitLoader}
          label={method === "CREATE" ? "Add" : "Save"}
          icon={method === "CREATE" ? faPlus : faPenToSquare}
          className="mx-auto mt-2"
        />
      )}
    </div>
  );
}
