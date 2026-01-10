import { ViewIcon } from "@chakra-ui/icons";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  FormControl,
  Input,
  useToast,
  Box,
  IconButton,
  Spinner,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { ChatState } from "../../Context/ChatProvider";
import UserBadgeItem from "../userAvatar/UserBadgeItem";
import UserListItem from "../userAvatar/UserListItem";

const UpdateGroupChatModal = ({ fetchMessages, fetchAgain, setFetchAgain }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupChatName, setGroupChatName] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);

  const toast = useToast();
  const { selectedChat, setSelectedChat, user } = ChatState();

  // ---------------- SEARCH USERS ----------------
  const handleSearch = async (query) => {
    if (!query) return;

    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/user?search=${query}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setSearchResult(data);
    } catch {
      toast({
        title: "Failed to load search results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RENAME GROUP (ADMIN ONLY) ----------------
  const handleRename = async () => {
    if (!groupChatName) return;

    if (selectedChat.groupAdmin._id !== user._id) {
      toast({
        title: "Only admin can rename the group",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setRenameLoading(true);
      const { data } = await axios.put(
        `/api/chat/rename`,
        {
          chatId: selectedChat._id,
          chatName: groupChatName,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setGroupChatName("");
    } catch (error) {
      toast({
        title: "Rename failed",
        description: error.response?.data?.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setRenameLoading(false);
    }
  };

  // ---------------- ADD USER (ADMIN ONLY) ----------------
  const handleAddUser = async (userToAdd) => {
    if (selectedChat.users.find((u) => u._id === userToAdd._id)) {
      toast({
        title: "User already in group",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    if (selectedChat.groupAdmin._id !== user._id) {
      toast({
        title: "Only admin can add users",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.put(
        `/api/chat/groupadd`,
        {
          chatId: selectedChat._id,
          userId: userToAdd._id,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
    } catch (error) {
      toast({
        title: "Failed to add user",
        description: error.response?.data?.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- REMOVE USER / LEAVE GROUP ----------------
  const handleRemove = async (userToRemove) => {
    const isSelf = userToRemove._id === user._id;
    const isAdmin = selectedChat.groupAdmin._id === user._id;

    if (!isSelf && !isAdmin) {
      toast({
        title: "Only admin can remove other users",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.put(
        `/api/chat/groupremove`,
        {
          chatId: selectedChat._id,
          userId: userToRemove._id,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (isSelf) {
        setSelectedChat(null);
      } else {
        setSelectedChat(data);
      }

      setFetchAgain(!fetchAgain);
      fetchMessages();
    } catch (error) {
      toast({
        title: "Failed to remove user",
        description: error.response?.data?.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <>
      <IconButton icon={<ViewIcon />} onClick={onOpen} />

      <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            fontSize="35px"
            fontFamily="Work sans"
            textAlign="center"
          >
            {selectedChat.chatName}
          </ModalHeader>

          <ModalCloseButton />
          <ModalBody>
            <Box display="flex" flexWrap="wrap" pb={3}>
              {selectedChat.users.map((u) => (
                <UserBadgeItem
                  key={u._id}
                  user={u}
                  admin={selectedChat.groupAdmin}
                  handleFunction={() => handleRemove(u)}
                />
              ))}
            </Box>

            <FormControl display="flex" mb={3}>
              <Input
                placeholder="Chat Name"
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
              />
              <Button
                ml={2}
                colorScheme="teal"
                isLoading={renameLoading}
                onClick={handleRename}
              >
                Update
              </Button>
            </FormControl>

            <FormControl>
              <Input
                placeholder="Add user to group"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </FormControl>

            {loading ? (
              <Spinner mt={4} />
            ) : (
              searchResult.map((u) => (
                <UserListItem
                  key={u._id}
                  user={u}
                  handleFunction={() => handleAddUser(u)}
                />
              ))
            )}
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="red" onClick={() => handleRemove(user)}>
              Leave Group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UpdateGroupChatModal;
