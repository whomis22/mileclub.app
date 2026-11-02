import { Image } from "expo-image";
import { Redirect, router, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  CommentPreview,
  openComments,
  useComments,
} from "@/components/comment-preview";
import { CommentsSheet } from "@/components/comments-sheet";
import { openPostActions } from "@/lib/post-actions";
import { PHOTOS } from "@/data/photos";
import { Avatar, MenuButton, Screen } from "@/components/ui";
import { agoLabel } from "@/data/comments";
import { FEED, TEXT_POSTS, type TextPost } from "@/data/feed";
import { COACHES } from "@/data/coaches";
import { PEOPLE, findPerson } from "@/data/people";
import { hoursAgoLabel } from "@/lib/time";
import { useStore } from "@/state/store";
import { colors, fonts, radius, space, themed, useTheme } from "@/theme";

const FILTERS = ["All", "Following", "Nearby", "Coaches"] as const;

function CommentButton({ postId }: { postId: string }) {
  const n = useComments(postId).length;
  return (
    <Pressable
      onPress={() => openComments(postId)}
      style={styles.action}
      accessibilityLabel="Comments"
    >
      <Text style={styles.bubble}>💬</Text>
      <Text style={styles.count}>{n}</Text>
    </Pressable>
  );
}

// A text-only post, like a tweet.
function TextPostCard({
  id,
  name,
  color,
  photoUri,
  when,
  text,
  likes,
  onOpenPerson,
  onMore,
}: {
  id: string;
  name: string;
  color?: string;
  photoUri?: string;
  when: string;
  text: string;
  likes: number;
  onOpenPerson?: () => void;
  onMore?: () => void;
}) {
  const { kudos, toggleKudos } = useStore();
  const liked = kudos.includes(id);
  return (
    <View style={styles.tweet}>
      <View style={styles.tweetHead}>
        <Pressable onPress={onOpenPerson}>
          <Avatar name={name} color={color} uri={photoUri} size={38} />
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={onOpenPerson}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>{when}</Text>
        </Pressable>
        {onMore ? (
          <Pressable onPress={onMore} hitSlop={10}>
            <Text style={styles.dots}>•••</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.tweetText}>{text}</Text>
      <View style={styles.actions}>
        <Pressable
          onPress={() => toggleKudos(id)}
          style={styles.action}
          accessibilityLabel="Like"
        >
          <Text style={[styles.heart, liked && { color: colors.peachDeep }]}>
            {liked ? "♥" : "♡"}
          </Text>
          <Text style={styles.count}>{likes + (liked ? 1 : 0)}</Text>
        </Pressable>
        <CommentButton postId={id} />
      </View>
      <CommentPreview postId={id} />
    </View>
  );
}

function SampleTextPost({ post }: { post: TextPost }) {
  const person = findPerson(post.personId);
  if (!person) return null;
  return (
    <TextPostCard
      id={post.id}
      name={person.firstName}
      color={person.color}
      when={hoursAgoLabel(post.hoursAgo)}
      text={post.text}
      likes={post.likes}
      onOpenPerson={() => router.push(`/person/${person.id}`)}
    />
  );
}

function duration(min: number) {
  const h = Math.floor(min / 60);
  return h ? `${h}h ${min % 60}m` : `${min}m`;
}

export default function Explore() {
  useTheme();
  const {
    profile,
    kudos,
    toggleKudos,
    blocked,
    following,
    toggleFollow,
    myPosts,
    archivePost,
    deletePost,
  } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = useState("");
  if (!profile) return <Redirect href="/welcome" />;

  const textPosts = TEXT_POSTS.filter((t) => !blocked.includes(t.personId));
  let posts = FEED.filter((p) => !blocked.includes(p.personId));
  if (filter === "Following")
    posts = posts.filter((p) => following.includes(p.personId));
  if (filter === "Nearby")
    posts = posts.filter(
      (p) => findPerson(p.personId)?.neighborhood === profile.neighborhood,
    );
  if (filter === "Coaches") posts = [];

  return (
    <Screen>
      <View style={styles.top}>
        <MenuButton onPress={() => router.push("/menu")} />
        <Text style={styles.title}>For You</Text>
        <Pressable style={styles.people} onPress={() => router.push("/people")}>
          <Text style={styles.peopleText}>People near you</Text>
        </Pressable>
      </View>

      <View style={styles.search}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search people by name"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={10}>
            <Text style={styles.searchClear}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {query.trim() ? (
        <View style={{ gap: space.sm }}>
          {[
            ...PEOPLE.filter((p) => !blocked.includes(p.id)).map((p) => ({
              id: p.id,
              name: p.firstName,
              color: p.color,
              sub: p.neighborhood,
              href: `/person/${p.id}`,
            })),
            ...COACHES.map((c) => ({
              id: c.id,
              name: c.name,
              color: c.color,
              sub: `Coach · ${c.headline}`,
              href: `/coach/${c.id}`,
            })),
          ]
            .filter((r) =>
              r.name.toLowerCase().includes(query.trim().toLowerCase()),
            )
            .map((r) => (
              <Pressable
                key={r.id}
                style={styles.result}
                onPress={() => router.push(r.href as Href)}
              >
                <Avatar name={r.name} color={r.color} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{r.name}</Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {r.sub}
                  </Text>
                </View>
                <Text style={styles.meta}>›</Text>
              </Pressable>
            ))}
          {![
            ...PEOPLE.map((p) => p.firstName),
            ...COACHES.map((c) => c.name),
          ].some((n) =>
            n.toLowerCase().includes(query.trim().toLowerCase()),
          ) ? (
            <Text style={styles.empty}>
              No one called “{query.trim()}” yet.
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={query.trim() ? { display: "none" } : undefined}>
        <View style={styles.tabs}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() =>
                f === "Coaches" ? router.push("/train") : setFilter(f)
              }
            >
              <Text style={[styles.tab, filter === f && styles.tabOn]}>
                {f}
              </Text>
            </Pressable>
          ))}
        </View>

        {!profile.gender ? (
          <Pressable
            style={styles.meetBanner}
            onPress={() => router.push("/meet-settings" as Href)}
          >
            <Text style={styles.meetTitle}>
              New: choose who you meet up with
            </Text>
            <Text style={styles.meetSub}>
              Everyone, women only or men only. Tap to set it →
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          style={styles.composer}
          onPress={() => router.push("/new-post" as Href)}
        >
          <Avatar name={profile.firstName} uri={profile.photoUri} size={36} />
          <Text style={styles.composerText}>Share a photo or a thought…</Text>
          <View style={styles.composerBtn}>
            <Text style={styles.composerBtnText}>Post</Text>
          </View>
        </Pressable>

        {filter !== "Nearby" && filter !== "Following"
          ? myPosts
              .filter((mp) => !mp.archived)
              .map((mp) => {
                const liked = kudos.includes(mp.id);
                const askDelete = () =>
                  openPostActions(mp, { archivePost, deletePost });
                if (!mp.uri)
                  return (
                    <TextPostCard
                      key={mp.id}
                      id={mp.id}
                      name={profile.firstName}
                      photoUri={profile.photoUri}
                      when={`Your post · ${agoLabel(mp.at)}`}
                      text={mp.caption}
                      likes={0}
                      onMore={askDelete}
                    />
                  );
                return (
                  <View key={mp.id} style={styles.post}>
                    <View style={styles.head}>
                      <Avatar
                        name={profile.firstName}
                        uri={profile.photoUri}
                        size={38}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{profile.firstName}</Text>
                        <Text style={styles.meta}>
                          Your post · {agoLabel(mp.at)}
                        </Text>
                      </View>
                      <Pressable onPress={askDelete} hitSlop={10}>
                        <Text style={styles.dots}>•••</Text>
                      </Pressable>
                    </View>
                    <View style={styles.photo}>
                      <Image
                        source={{ uri: mp.uri }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                      />
                    </View>
                    <View style={styles.actions}>
                      <Pressable
                        onPress={() => toggleKudos(mp.id)}
                        style={styles.action}
                        accessibilityLabel="Like"
                      >
                        <Text
                          style={[
                            styles.heart,
                            liked && { color: colors.peachDeep },
                          ]}
                        >
                          {liked ? "♥" : "♡"}
                        </Text>
                        <Text style={styles.count}>{liked ? 1 : 0}</Text>
                      </Pressable>
                      <CommentButton postId={mp.id} />
                    </View>
                    {mp.caption ? (
                      <Text style={styles.caption}>
                        <Text style={{ fontFamily: fonts.sansSemi }}>
                          {profile.firstName}{" "}
                        </Text>
                        {mp.caption}
                      </Text>
                    ) : null}
                    <CommentPreview postId={mp.id} />
                  </View>
                );
              })
          : null}

        {posts.length === 0 ? (
          <Text style={styles.empty}>
            {filter === "Following"
              ? "Follow people to see their runs here."
              : "Nothing here yet."}
          </Text>
        ) : null}

        {posts.map((post, i) => {
          const person = findPerson(post.personId);
          if (!person) return null;
          const liked = kudos.includes(post.id);
          const follows = following.includes(person.id);
          const tp = filter === "All" ? textPosts[i] : undefined;
          return (
            <View key={post.id}>
              <View style={styles.post}>
                <View style={styles.head}>
                  <Pressable
                    onPress={() => router.push(`/person/${person.id}`)}
                  >
                    <Avatar
                      name={person.firstName}
                      color={person.color}
                      size={38}
                    />
                  </Pressable>
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => router.push(`/person/${person.id}`)}
                  >
                    <Text style={styles.name}>{person.firstName}</Text>
                    <Text style={styles.meta}>
                      {post.withCount
                        ? `Ran with ${post.withCount} others · `
                        : ""}
                      {hoursAgoLabel(post.hoursAgo)}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => toggleFollow(person.id)}
                    style={[styles.follow, follows && styles.following]}
                  >
                    <Text
                      style={[
                        styles.followText,
                        follows && { color: colors.ink },
                      ]}
                    >
                      {follows ? "Following" : "Follow"}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.photo}>
                  <Image
                    source={PHOTOS[FEED.indexOf(post) % PHOTOS.length]}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  <View style={styles.overlay}>
                    <Text style={styles.postTitle} numberOfLines={2}>
                      {post.title}
                    </Text>
                    <Text style={styles.stats}>
                      {post.distanceKm
                        ? `${post.distanceKm.toFixed(1)} KM\n`
                        : ""}
                      {post.pace ? `${post.pace.toUpperCase()}\n` : ""}
                      {duration(post.minutes).toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    onPress={() => toggleKudos(post.id)}
                    style={styles.action}
                    accessibilityLabel="Like"
                  >
                    <Text
                      style={[
                        styles.heart,
                        liked && { color: colors.peachDeep },
                      ]}
                    >
                      {liked ? "♥" : "♡"}
                    </Text>
                    <Text style={styles.count}>
                      {post.kudos + (liked ? 1 : 0)}
                    </Text>
                  </Pressable>
                  <CommentButton postId={post.id} />
                  <Text style={styles.place}>{post.place}</Text>
                </View>
                {post.note ? (
                  <Text style={styles.caption}>
                    <Text style={{ fontFamily: fonts.sansSemi }}>
                      {person.firstName}{" "}
                    </Text>
                    {post.note}
                  </Text>
                ) : null}
                <CommentPreview postId={post.id} />
              </View>
              {tp ? <SampleTextPost post={tp} /> : null}
            </View>
          );
        })}
      </View>
      <CommentsSheet />
    </Screen>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    top: { flexDirection: "row", alignItems: "center", gap: space.md },
    title: {
      flex: 1,
      fontFamily: fonts.serif,
      fontSize: 30,
      color: colors.ink,
    },
    people: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.line,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    peopleText: {
      fontFamily: fonts.sansMedium,
      color: colors.ink,
      fontSize: 12,
    },
    tabs: {
      flexDirection: "row",
      gap: 22,
      marginTop: space.lg,
      marginBottom: space.lg,
    },
    tab: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: colors.muted,
      paddingBottom: 6,
    },
    tabOn: {
      fontFamily: fonts.sansSemi,
      color: colors.ink,
      borderBottomWidth: 1.5,
      borderBottomColor: colors.ink,
    },
    empty: {
      fontFamily: fonts.sans,
      color: colors.muted,
      textAlign: "center",
      marginTop: space.xl,
    },
    post: { marginBottom: space.xxl },
    head: {
      flexDirection: "row",
      alignItems: "center",
      gap: space.md,
      marginBottom: space.md,
    },
    name: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink },
    meta: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: colors.muted,
      marginTop: 1,
    },
    follow: {
      borderRadius: radius.pill,
      backgroundColor: colors.peach,
      paddingVertical: 7,
      paddingHorizontal: 14,
    },
    following: { backgroundColor: colors.sand },
    followText: {
      fontFamily: fonts.sansSemi,
      fontSize: 12,
      color: colors.onPeach,
    },
    photo: {
      height: 330,
      borderRadius: 28,
      overflow: "hidden",
      backgroundColor: colors.oliveDark,
    },
    overlay: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 16,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: space.md,
    },
    postTitle: {
      flex: 1,
      fontFamily: fonts.serifItalic,
      fontSize: 24,
      lineHeight: 32,
      color: colors.onBrand,
    },
    stats: {
      fontFamily: fonts.sansMedium,
      fontSize: 10,
      letterSpacing: 1.2,
      lineHeight: 15,
      color: colors.onBrand,
      textAlign: "right",
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: space.lg,
      marginTop: space.md,
    },
    action: { flexDirection: "row", alignItems: "center", gap: 6 },
    heart: { fontSize: 22, color: colors.ink },
    count: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
    place: {
      flex: 1,
      textAlign: "right",
      fontFamily: fonts.sans,
      fontSize: 12,
      color: colors.muted,
    },
    bubble: { fontSize: 18 },
    search: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.card,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: 14,
      marginTop: space.md,
    },
    searchIcon: { fontSize: 14 },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontFamily: fonts.sans,
      fontSize: 15,
      color: colors.ink,
    },
    searchClear: { fontSize: 14, color: colors.muted },
    result: {
      flexDirection: "row",
      alignItems: "center",
      gap: space.md,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: space.md,
    },
    meetBanner: {
      backgroundColor: colors.oliveSoft,
      borderRadius: radius.lg,
      padding: space.lg,
      marginBottom: space.lg,
      gap: 2,
    },
    meetTitle: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink },
    meetSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
    tweet: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: space.lg,
      marginBottom: space.xxl,
    },
    tweetHead: { flexDirection: "row", alignItems: "center", gap: space.md },
    tweetText: {
      fontFamily: fonts.sans,
      fontSize: 17,
      lineHeight: 25,
      color: colors.ink,
      marginTop: space.md,
    },
    dots: {
      fontFamily: fonts.sansBold,
      fontSize: 14,
      color: colors.muted,
      letterSpacing: 1,
    },
    composer: {
      flexDirection: "row",
      alignItems: "center",
      gap: space.md,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: space.md,
      marginBottom: space.xl,
    },
    composerText: {
      flex: 1,
      fontFamily: fonts.sans,
      fontSize: 14,
      color: colors.muted,
    },
    composerBtn: {
      backgroundColor: colors.olive,
      borderRadius: radius.pill,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    composerBtnText: {
      fontFamily: fonts.sansSemi,
      fontSize: 13,
      color: colors.onBrand,
    },
    caption: {
      fontFamily: fonts.sans,
      fontSize: 14,
      lineHeight: 20,
      color: colors.ink,
      marginTop: space.sm,
    },
  }),
);
