import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { LocationCard } from "@/components/location-card";
import { Avatar, Logo } from "@/components/ui";
import { findThread, type ChatMessage } from "@/data/messages";
import { NEIGHBORHOODS } from "@/data/options";
import { findPerson } from "@/data/people";
import * as Location from "expo-location";

import { callRule } from "@/lib/calls";
import { useGroupSettings } from "@/lib/group-settings";
import { useStore } from "@/state/store";
import { colors, fonts, radius, space, themed, useTheme } from "@/theme";

export default function Chat() {
  useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const thread = findThread(id);
  const settings = useGroupSettings();
  const [messages, setMessages] = useState<ChatMessage[]>(
    thread?.messages ?? [],
  );
  const [draft, setDraft] = useState("");
  const [liked, setLiked] = useState<string[]>([]);
  // Hold a message: react, reply, pin, report or delete (like WhatsApp).
  const [selected, setSelected] = useState<ChatMessage | null>(null);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const { profile, following, toggleFollow, block, admin, calls, deleteCall } =
    useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();
  if (!thread) return null;

  const isGroup = thread.kind === "group";
  const person = thread.personId ? findPerson(thread.personId) : undefined;
  // Mock: you are a regular member, so when "Only admins can post" is on you can read and react, not send.
  const canSend = !isGroup || !settings.adminsOnly;
  // Calls and location sharing are only for people you follow.
  const follows = !!person && following.includes(person.id);

  // Calls and location need you to follow them first; offer to follow right there.
  function needsFollow(action: string, then: () => void) {
    if (follows) return then();
    Alert.alert(
      `Follow ${thread!.name} to ${action}`,
      "You can call and share your location with people you follow.",
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Follow",
          onPress: () => {
            toggleFollow(person!.id);
            then();
          },
        },
      ],
    );
  }
  // Calls: only when you follow each other (admins can call anyone).
  function call(video = false) {
    const go = () =>
      router.push(`/call/${person!.id}${video ? "?video=1" : ""}` as Href);
    const rule = callRule(person!.id, following, admin);
    if (rule.ok) return go();
    const name = thread!.name;
    if (!rule.iFollow && rule.theyFollow) {
      Alert.alert(
        `Follow ${name} back to call`,
        `${name} follows you. Follow back and you can call each other.`,
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Follow back",
            onPress: () => {
              toggleFollow(person!.id);
              go();
            },
          },
        ],
      );
    } else if (!rule.iFollow) {
      Alert.alert(
        `You can’t call ${name} yet`,
        `You can call each other once you both follow each other.`,
        [
          { text: "Not now", style: "cancel" },
          { text: `Follow ${name}`, onPress: () => toggleFollow(person!.id) },
        ],
      );
    } else {
      Alert.alert(
        `You can’t call ${name} yet`,
        `You follow ${name}, but ${name} doesn’t follow you back yet. You can call once you follow each other.`,
      );
    }
  }
  const askLocation = () => needsFollow("share your location", shareLocation);

  function onBlock() {
    Alert.alert(
      `Block ${thread!.name}?`,
      "You won't see each other or each other's activities.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            block(person!.id);
            router.back();
          },
        },
      ],
    );
  }

  function shareLocation() {
    Alert.alert(
      `Share your location with ${thread!.name}?`,
      "They will see where you are for the next hour.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Share",
          onPress: async () => {
            // Your real position if you allow it, otherwise the middle of your neighbourhood.
            const home = profile
              ? NEIGHBORHOODS[profile.neighborhood]
              : NEIGHBORHOODS.Centrum;
            let pos: { lat: number; lng: number } = {
              lat: home.lat,
              lng: home.lng,
            };
            try {
              const perm = await Location.requestForegroundPermissionsAsync();
              if (perm.granted) {
                const here = await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.Balanced,
                });
                pos = { lat: here.coords.latitude, lng: here.coords.longitude };
              }
            } catch {}
            setMessages((m) => [
              ...m,
              {
                id: `${Date.now()}`,
                from: "me",
                text: "Shared location",
                location: true,
                ...pos,
              },
            ]);
          },
        },
      ],
    );
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      {
        id: `${Date.now()}`,
        from: "me",
        text,
        ...(replyTo
          ? {
              reply: `${replyTo.from === "me" ? "You" : thread!.name}: ${replyTo.text}`,
            }
          : {}),
      },
    ]);
    setDraft("");
    setReplyTo(null);
  }

  // Messages and calls in time order (sample messages first, they have no time).
  const timeline: ChatMessage[] = [
    ...messages.map((m) => ({
      ...m,
      at: m.at ?? (/^\d+$/.test(m.id) ? Number(m.id) : 0),
    })),
    ...(person
      ? calls
          .filter((c) => c.personId === person.id)
          .map(
            (c): ChatMessage => ({
              id: c.id,
              from: "me",
              text: c.video ? "Video call" : "Voice call",
              call: { video: c.video, secs: c.secs, answered: c.answered },
              at: c.at,
            }),
          )
      : []),
  ]
    .filter((m) => !hidden.includes(m.id))
    .sort((x, y) => (x.at ?? 0) - (y.at ?? 0));
  const pinnedMsg = timeline.find((m) => m.id === pinned);

  function remove(m: ChatMessage) {
    if (calls.some((c) => c.id === m.id)) deleteCall(m.id);
    else setHidden((h) => [...h, m.id]);
    if (pinned === m.id) setPinned(null);
  }

  function callBubble(m: ChatMessage) {
    const c = m.call!;
    const mine = m.from === "me";
    const dur =
      c.secs < 60 ? `${c.secs} sec` : `${Math.round(c.secs / 60)} min`;
    return (
      <View
        style={[
          styles.bubble,
          styles.callBubble,
          mine ? styles.mine : styles.theirs,
        ]}
      >
        <View
          style={[
            styles.callIcon,
            mine
              ? { backgroundColor: "rgba(0,0,0,0.22)" }
              : { backgroundColor: colors.card },
          ]}
        >
          <Text style={[styles.callGlyph, mine && { color: colors.onBrand }]}>
            {c.video ? "🎥" : mine ? "📞↗" : "📞↙"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.callTitle, mine && { color: colors.onBrand }]}>
            {c.answered
              ? c.video
                ? "Video call"
                : "Voice call"
              : mine
                ? "Cancelled call"
                : "Missed call"}
          </Text>
          <Text
            style={[
              styles.callSub,
              mine && { color: colors.onBrand, opacity: 0.75 },
            ]}
          >
            {c.answered ? dur : "Tap to call back"}
          </Text>
        </View>
        {m.at ? (
          <Text
            style={[
              styles.callTime,
              mine && { color: colors.onBrand, opacity: 0.75 },
            ]}
          >
            {new Date(m.at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        ) : null}
      </View>
    );
  }

  function renderMsg(m: ChatMessage) {
    const mine = m.from === "me";
    return (
      <View key={m.id} style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
        {m.location ? (
          <LocationCard
            mine={mine}
            name={mine ? "My location" : `${thread!.name}’s location`}
            lat={
              m.lat ??
              NEIGHBORHOODS[
                (mine ? profile?.neighborhood : person?.neighborhood) ??
                  "Centrum"
              ].lat
            }
            lng={
              m.lng ??
              NEIGHBORHOODS[
                (mine ? profile?.neighborhood : person?.neighborhood) ??
                  "Centrum"
              ].lng
            }
          />
        ) : m.call ? (
          <Pressable
            onPress={() => call(m.call!.video)}
            onLongPress={() => setSelected(m)}
            delayLongPress={300}
          >
            {callBubble(m)}
          </Pressable>
        ) : (
          <Pressable
            onLongPress={() => setSelected(m)}
            delayLongPress={300}
            style={[styles.bubble, mine ? styles.mine : styles.theirs]}
          >
            {m.from === "admin" ? (
              <Text style={styles.admin}>Mile Club · Admin</Text>
            ) : null}
            {m.reply ? (
              <View
                style={[
                  styles.quote,
                  mine && { borderLeftColor: colors.onBrand },
                ]}
              >
                <Text
                  style={[styles.quoteText, mine && { color: colors.onBrand }]}
                  numberOfLines={2}
                >
                  {m.reply}
                </Text>
              </View>
            ) : null}
            <Text style={[styles.text, mine && { color: colors.onBrand }]}>
              {m.text}
            </Text>
          </Pressable>
        )}
        {reactions[m.id] ? (
          <Pressable
            onPress={() => setReactions((r) => ({ ...r, [m.id]: "" }))}
            style={[
              styles.reaction,
              mine ? { marginRight: 10 } : { marginLeft: 10 },
            ]}
          >
            <Text style={{ fontSize: 15 }}>{reactions[m.id]}</Text>
          </Pressable>
        ) : null}
        {isGroup && settings.reactions ? (
          <Pressable
            onPress={() =>
              setLiked((l) =>
                l.includes(m.id) ? l.filter((x) => x !== m.id) : [...l, m.id],
              )
            }
            style={[styles.react, liked.includes(m.id) && styles.reactOn]}
          >
            <Text
              style={[
                styles.reactText,
                liked.includes(m.id) && { color: colors.onPeach },
              ]}
            >
              {liked.includes(m.id) ? "♥ Liked" : "♡ Like"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.head}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Back"
          style={styles.back}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        {isGroup ? (
          <View style={styles.groupIcon}>
            <Logo size={18} m={colors.bg} />
          </View>
        ) : (
          <Avatar name={thread.name} color={person?.color} size={42} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{thread.name}</Text>
          <Text style={styles.sub}>
            {isGroup ? "Everyone who joins Mile Club" : "Active now"}
          </Text>
        </View>
        {person ? (
          <>
            <Pressable
              onPress={() => call()}
              style={styles.call}
              accessibilityLabel={`Call ${thread.name}`}
            >
              <Text style={styles.callText}>📞</Text>
            </Pressable>
            <Pressable
              onPress={() => setMenuOpen(true)}
              style={styles.more}
              accessibilityLabel="More options"
            >
              <Text style={styles.moreText}>•••</Text>
            </Pressable>
          </>
        ) : null}
        {isGroup ? (
          <Pressable
            onPress={() => router.push("/group-settings")}
            style={styles.info}
            accessibilityLabel="Group settings"
          >
            <Text style={styles.infoText}>i</Text>
          </Pressable>
        ) : null}
      </View>

      {pinnedMsg ? (
        <Pressable
          style={styles.pinBar}
          onPress={() => setPinned(null)}
          accessibilityLabel="Unpin"
        >
          <Text>📌</Text>
          <Text style={styles.pinBarText} numberOfLines={1}>
            {pinnedMsg.text}
          </Text>
          <Text style={{ color: colors.muted }}>✕</Text>
        </Pressable>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.list}>
          {isGroup ? (
            <Text style={styles.system}>You joined Mile Club Members</Text>
          ) : (
            <Text style={styles.day}>TODAY</Text>
          )}

          {timeline.map((m) => renderMsg(m))}
        </ScrollView>

        {canSend ? (
          <>
            {replyTo ? (
              <View style={styles.replyBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.replyWho}>
                    Replying to{" "}
                    {replyTo.from === "me" ? "yourself" : thread.name}
                  </Text>
                  <Text style={styles.replyText} numberOfLines={1}>
                    {replyTo.text}
                  </Text>
                </View>
                <Pressable onPress={() => setReplyTo(null)} hitSlop={10}>
                  <Text style={{ color: colors.muted }}>✕</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.composer}>
              {person ? (
                <Pressable
                  onPress={askLocation}
                  style={styles.pinBtn}
                  accessibilityLabel="Send location"
                >
                  <Text style={styles.pinText}>📍</Text>
                </Pressable>
              ) : null}
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={`Message ${thread.name}`}
                placeholderTextColor={colors.muted}
                style={styles.input}
                onSubmitEditing={send}
                returnKeyType="send"
              />
              <Pressable
                onPress={send}
                style={styles.send}
                accessibilityLabel="Send"
              >
                <Text style={styles.sendText}>↑</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.locked}>
            <Text style={styles.lockedText}>
              Only admins can send messages. You can react.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { top: insets.top + 64 }]}>
            {(
              [
                [
                  follows ? "✓" : "＋",
                  follows ? `Unfollow ${thread.name}` : `Follow ${thread.name}`,
                  () => toggleFollow(person!.id),
                ],
                ["📞", "Call", () => call()],
                ["🎥", "Video call", () => call(true)],
                ["📍", "Send location", askLocation],
                ["⛔", `Block ${thread.name}`, onBlock],
              ] as [string, string, () => void][]
            ).map(([icon, label, fn], i) => (
              <Pressable
                key={label}
                style={({ pressed }) => [
                  styles.menuRow,
                  i > 0 && styles.menuLine,
                  pressed && { backgroundColor: colors.sand },
                ]}
                onPress={() => {
                  setMenuOpen(false);
                  setTimeout(fn, 250);
                }}
              >
                <Text style={styles.menuIcon}>{icon}</Text>
                <Text
                  style={[
                    styles.menuText,
                    label.startsWith("Block") && { color: colors.danger },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable
          style={styles.holdBackdrop}
          onPress={() => setSelected(null)}
        >
          <View style={styles.emojiRow}>
            {["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥"].map((e) => (
              <Pressable
                key={e}
                onPress={() => {
                  setReactions((r) => ({
                    ...r,
                    [selected!.id]: r[selected!.id] === e ? "" : e,
                  }));
                  setSelected(null);
                }}
                hitSlop={4}
              >
                <Text style={styles.emoji}>{e}</Text>
              </Pressable>
            ))}
          </View>
          {selected ? (
            <View
              style={[
                styles.holdPreview,
                selected.from === "me" && { alignSelf: "flex-end" },
              ]}
            >
              {selected.call ? (
                callBubble(selected)
              ) : (
                <Text style={styles.text}>{selected.text}</Text>
              )}
            </View>
          ) : null}
          <View
            style={[
              styles.holdMenu,
              selected?.from === "me" && { alignSelf: "flex-end" },
            ]}
          >
            {(
              [
                ["↩︎", "Reply", () => setReplyTo(selected)],
                [
                  "📌",
                  pinned === selected?.id ? "Unpin" : "Pin",
                  () =>
                    setPinned(pinned === selected?.id ? null : selected!.id),
                ],
                [
                  "⚠️",
                  "Report",
                  () =>
                    Alert.alert(
                      "Report sent",
                      "Thanks. Our team will take a look.",
                    ),
                ],
                ["🗑", "Delete", () => remove(selected!)],
              ] as [string, string, () => void][]
            ).map(([icon, label, fn], i) => (
              <Pressable
                key={label}
                style={[
                  styles.holdRow,
                  i > 0 && { borderTopWidth: 1, borderTopColor: colors.line },
                ]}
                onPress={() => {
                  setSelected(null);
                  fn();
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    width: 24,
                    textAlign: "center",
                    color: colors.ink,
                  }}
                >
                  {icon}
                </Text>
                <Text
                  style={[
                    styles.holdText,
                    label === "Delete" && { color: colors.danger },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    head: {
      flexDirection: "row",
      alignItems: "center",
      gap: space.md,
      paddingHorizontal: space.lg,
      paddingVertical: space.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    back: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: "center",
      justifyContent: "center",
    },
    backText: { fontSize: 28, lineHeight: 30, color: colors.ink },
    groupIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: colors.olive,
      alignItems: "center",
      justifyContent: "center",
    },
    name: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink },
    sub: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.link },
    call: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.oliveSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    callText: { fontSize: 18 },
    more: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: "center",
      justifyContent: "center",
    },
    moreText: {
      fontFamily: fonts.sansBold,
      fontSize: 13,
      letterSpacing: 1,
      color: colors.ink,
    },
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)" },
    menu: {
      position: "absolute",
      top: 100,
      right: 16,
      width: 240,
      borderRadius: 18,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.line,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    menuLine: { borderTopWidth: 1, borderTopColor: colors.line },
    menuIcon: {
      fontSize: 18,
      width: 24,
      textAlign: "center",
      color: colors.ink,
    },
    menuText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink },
    pinBtn: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: "center",
      justifyContent: "center",
    },
    pinText: { fontSize: 20 },
    info: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: colors.ink,
      alignItems: "center",
      justifyContent: "center",
    },
    infoText: {
      fontFamily: fonts.serifItalic,
      fontSize: 18,
      color: colors.ink,
    },
    list: { padding: space.lg, gap: space.sm },
    day: {
      alignSelf: "center",
      fontFamily: fonts.sans,
      fontSize: 11,
      letterSpacing: 1,
      color: colors.muted,
    },
    system: {
      alignSelf: "center",
      fontFamily: fonts.sans,
      fontSize: 12,
      color: colors.muted,
      backgroundColor: colors.sand,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
      overflow: "hidden",
    },
    bubble: {
      maxWidth: "80%",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 20,
    },
    theirs: { backgroundColor: colors.sand, borderBottomLeftRadius: 6 },
    mine: { backgroundColor: colors.olive, borderBottomRightRadius: 6 },
    admin: {
      fontFamily: fonts.sansSemi,
      fontSize: 12,
      color: colors.link,
      marginBottom: 2,
    },
    text: {
      fontFamily: fonts.sans,
      fontSize: 15,
      lineHeight: 21,
      color: colors.ink,
    },
    react: {
      marginTop: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.card,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    reactOn: { backgroundColor: colors.peach, borderColor: colors.peach },
    reactText: {
      fontFamily: fonts.sansMedium,
      fontSize: 12,
      color: colors.ink,
    },
    composer: {
      flexDirection: "row",
      gap: space.sm,
      padding: space.md,
      alignItems: "center",
    },
    input: {
      flex: 1,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: space.lg,
      fontFamily: fonts.sans,
      fontSize: 15,
      color: colors.ink,
    },
    send: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.olive,
      alignItems: "center",
      justifyContent: "center",
    },
    sendText: {
      color: colors.onBrand,
      fontSize: 22,
      fontFamily: fonts.sansBold,
    },
    callBubble: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minWidth: 230,
      paddingVertical: 12,
    },
    callIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    callGlyph: { fontSize: 15, color: colors.ink },
    callTitle: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.ink },
    callSub: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: colors.muted,
      marginTop: 2,
    },
    callTime: {
      alignSelf: "flex-end",
      fontFamily: fonts.sans,
      fontSize: 11,
      color: colors.muted,
    },
    quote: {
      borderLeftWidth: 3,
      borderLeftColor: colors.olive,
      paddingLeft: 8,
      marginBottom: 6,
      opacity: 0.85,
    },
    quoteText: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink },
    reaction: {
      marginTop: -8,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    pinBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: space.lg,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      backgroundColor: colors.card,
    },
    pinBarText: {
      flex: 1,
      fontFamily: fonts.sans,
      fontSize: 13,
      color: colors.ink,
    },
    replyBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginHorizontal: space.md,
      marginTop: space.sm,
      padding: 10,
      borderRadius: 14,
      backgroundColor: colors.sand,
      borderLeftWidth: 3,
      borderLeftColor: colors.olive,
    },
    replyWho: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.link },
    replyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink },
    holdBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      padding: 20,
      gap: 12,
    },
    emojiRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignSelf: "stretch",
      backgroundColor: colors.card,
      borderRadius: 34,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    emoji: { fontSize: 30 },
    holdPreview: {
      alignSelf: "flex-start",
      maxWidth: "85%",
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 12,
    },
    holdMenu: {
      width: 240,
      backgroundColor: colors.card,
      borderRadius: 18,
      overflow: "hidden",
    },
    holdRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 18,
    },
    holdText: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.ink },
    locked: {
      margin: space.md,
      minHeight: 50,
      borderRadius: 25,
      backgroundColor: colors.sand,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: space.lg,
    },
    lockedText: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: colors.muted,
      textAlign: "center",
    },
  }),
);
