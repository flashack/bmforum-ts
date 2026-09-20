--
-- PostgreSQL database dump
--

\restrict 4sFu0eB1egnCpa2RIlnbNpRK4EkbK3eNCsz3HAERAJbdwD61px52QzzqnRo4k6A

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actlogs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.actlogs (
    id integer NOT NULL,
    actdetail text DEFAULT ''::text NOT NULL,
    acter text DEFAULT ''::text NOT NULL,
    actreason text DEFAULT ''::text NOT NULL,
    acttime integer DEFAULT 0 NOT NULL,
    forumid integer DEFAULT 0 NOT NULL,
    actioncode text DEFAULT ''::text NOT NULL
);


--
-- Name: actlogs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.actlogs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: actlogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.actlogs_id_seq OWNED BY public.actlogs.id;


--
-- Name: adminlog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.adminlog (
    id integer NOT NULL,
    "time" bigint DEFAULT 0 NOT NULL,
    operator character varying(24) DEFAULT ''::character varying NOT NULL,
    action character varying(40) DEFAULT ''::character varying NOT NULL,
    detail text DEFAULT ''::text NOT NULL
);


--
-- Name: adminlog_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.adminlog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: adminlog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.adminlog_id_seq OWNED BY public.adminlog.id;


--
-- Name: announces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announces (
    id integer NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    author text DEFAULT ''::text NOT NULL,
    addtime integer DEFAULT 0 NOT NULL,
    url text DEFAULT ''::text NOT NULL
);


--
-- Name: announces_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.announces_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: announces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.announces_id_seq OWNED BY public.announces.id;


--
-- Name: attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attachments (
    id integer NOT NULL,
    tid integer DEFAULT 0 NOT NULL,
    pid integer DEFAULT 0 NOT NULL,
    filename text DEFAULT ''::text NOT NULL,
    mimetype text DEFAULT 'application/octet-stream'::text NOT NULL,
    size integer DEFAULT 0 NOT NULL,
    uploader character varying(24) DEFAULT ''::character varying NOT NULL,
    uploadtime bigint DEFAULT 0 NOT NULL,
    downloads integer DEFAULT 0 NOT NULL,
    isavatar smallint DEFAULT 0 NOT NULL,
    data bytea NOT NULL
);


--
-- Name: attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attachments_id_seq OWNED BY public.attachments.id;


--
-- Name: banname; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banname (
    name character varying(60) NOT NULL
);


--
-- Name: bbs_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bbs_config (
    key text NOT NULL,
    value text DEFAULT ''::text NOT NULL
);


--
-- Name: beg; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.beg (
    id character varying(30) NOT NULL,
    tid integer DEFAULT 0 NOT NULL,
    beglog text DEFAULT ''::text NOT NULL,
    giftid text DEFAULT ''::text NOT NULL,
    begers integer DEFAULT 0 NOT NULL,
    begmoneys integer DEFAULT 0 NOT NULL
);


--
-- Name: config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config (
    key text NOT NULL,
    value text DEFAULT ''::text NOT NULL
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id integer NOT NULL,
    owner integer NOT NULL,
    contacts integer NOT NULL,
    conname character varying(60) DEFAULT ''::character varying NOT NULL,
    adddate integer DEFAULT 0 NOT NULL,
    type smallint DEFAULT 0 NOT NULL
);


--
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contacts_id_seq OWNED BY public.contacts.id;


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id integer NOT NULL,
    tid integer NOT NULL,
    owner integer NOT NULL,
    addtime integer DEFAULT 0 NOT NULL
);


--
-- Name: favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.favorites_id_seq OWNED BY public.favorites.id;


--
-- Name: forumdata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forumdata (
    id integer NOT NULL,
    type text DEFAULT 'forum'::text NOT NULL,
    bbsname text DEFAULT ''::text NOT NULL,
    cdes text DEFAULT ''::text NOT NULL,
    forum_cid integer DEFAULT 0 NOT NULL,
    blad text DEFAULT ''::text NOT NULL,
    showorder integer DEFAULT 0 NOT NULL,
    topicnum integer DEFAULT 0 NOT NULL,
    replysnum integer DEFAULT 0 NOT NULL,
    todayp integer DEFAULT 0 NOT NULL,
    todaypt integer DEFAULT 0 NOT NULL,
    fltitle text DEFAULT ''::text NOT NULL,
    flposter text DEFAULT ''::text NOT NULL,
    flposttime integer DEFAULT 0 NOT NULL,
    guestpost text DEFAULT '1'::text NOT NULL,
    digestcount integer DEFAULT 0 NOT NULL
);


--
-- Name: forumdata_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.forumdata_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: forumdata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.forumdata_id_seq OWNED BY public.forumdata.id;


--
-- Name: forumlog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forumlog (
    id integer NOT NULL,
    fid integer DEFAULT 0 NOT NULL,
    "time" integer DEFAULT 0 NOT NULL,
    operator character varying(60) DEFAULT ''::character varying NOT NULL,
    action character varying(100) DEFAULT ''::character varying NOT NULL,
    detail text DEFAULT ''::text NOT NULL
);


--
-- Name: forumlog_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.forumlog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: forumlog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.forumlog_id_seq OWNED BY public.forumlog.id;


--
-- Name: invitecode; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invitecode (
    id integer NOT NULL,
    code character varying(32) NOT NULL,
    usedby character varying(24) DEFAULT ''::character varying NOT NULL,
    usedtime bigint DEFAULT 0 NOT NULL,
    createtime bigint DEFAULT 0 NOT NULL
);


--
-- Name: invitecode_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invitecode_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invitecode_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invitecode_id_seq OWNED BY public.invitecode.id;


--
-- Name: ipban; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ipban (
    id integer NOT NULL,
    ip text NOT NULL,
    reason text DEFAULT ''::text NOT NULL,
    addtime bigint DEFAULT 0 NOT NULL
);


--
-- Name: ipban_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ipban_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ipban_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ipban_id_seq OWNED BY public.ipban.id;


--
-- Name: lastest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lastest (
    id integer DEFAULT 1 NOT NULL,
    threadnum integer DEFAULT 0 NOT NULL,
    postsnum integer DEFAULT 0 NOT NULL,
    regednum integer DEFAULT 0 NOT NULL,
    todaynew integer DEFAULT 0 NOT NULL,
    lasttodaytime integer DEFAULT 0 NOT NULL,
    maxnews integer DEFAULT 0 NOT NULL,
    lastposter text DEFAULT ''::text NOT NULL,
    lastpostid integer DEFAULT 0 NOT NULL,
    lastptime integer DEFAULT 0 NOT NULL
);


--
-- Name: notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification (
    nid integer NOT NULL,
    senderid integer DEFAULT 0 NOT NULL,
    sendername character varying(60) DEFAULT ''::character varying NOT NULL,
    receiverid integer DEFAULT 0 NOT NULL,
    ntype character varying(20) DEFAULT ''::character varying NOT NULL,
    nvalue text DEFAULT ''::text NOT NULL,
    pkey integer DEFAULT 0 NOT NULL,
    "timestamp" integer DEFAULT 0 NOT NULL,
    isread smallint DEFAULT 0 NOT NULL
);


--
-- Name: notification_nid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_nid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notification_nid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_nid_seq OWNED BY public.notification.nid;


--
-- Name: onlinestat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onlinestat (
    username text DEFAULT ''::text NOT NULL,
    onusrid integer DEFAULT 0 NOT NULL,
    "timestamp" integer DEFAULT 0 NOT NULL,
    ips text DEFAULT ''::text NOT NULL,
    filename text DEFAULT ''::text NOT NULL,
    ugnum integer DEFAULT 0 NOT NULL
);


--
-- Name: polls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.polls (
    tid integer NOT NULL,
    options jsonb DEFAULT '[]'::jsonb NOT NULL,
    polluser jsonb DEFAULT '[]'::jsonb NOT NULL,
    maxchoose integer DEFAULT 1 NOT NULL,
    deadline integer DEFAULT 0 NOT NULL,
    viewafter smallint DEFAULT 0 NOT NULL,
    minposts integer DEFAULT 0 NOT NULL
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    tid integer NOT NULL,
    forumid integer DEFAULT 0 NOT NULL,
    articletitle text DEFAULT ''::text NOT NULL,
    username text DEFAULT ''::text NOT NULL,
    usrid integer DEFAULT 0 NOT NULL,
    articlecontent text DEFAULT ''::text NOT NULL,
    "timestamp" integer DEFAULT 0 NOT NULL,
    changtime integer DEFAULT 0 NOT NULL,
    posttrash smallint DEFAULT 0 NOT NULL,
    sellbuyer text DEFAULT ''::text NOT NULL,
    editinfo text DEFAULT ''::text NOT NULL,
    ip text DEFAULT ''::text NOT NULL
);


--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: primsg; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.primsg (
    id integer NOT NULL,
    belong character varying(60) DEFAULT ''::character varying NOT NULL,
    sender character varying(60) DEFAULT ''::character varying NOT NULL,
    sendto character varying(60) DEFAULT ''::character varying NOT NULL,
    prtitle character varying(200) DEFAULT ''::character varying NOT NULL,
    prcontent text DEFAULT ''::text NOT NULL,
    prtime integer DEFAULT 0 NOT NULL,
    prread smallint DEFAULT 0 NOT NULL,
    prtype character(1) DEFAULT 'r'::bpchar NOT NULL
);


--
-- Name: primsg_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.primsg_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: primsg_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.primsg_id_seq OWNED BY public.primsg.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid text NOT NULL,
    userid integer NOT NULL,
    logintime integer DEFAULT 0 NOT NULL,
    lastactive integer DEFAULT 0 NOT NULL,
    ip text DEFAULT ''::text NOT NULL
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    tagid integer NOT NULL,
    tagname character varying(100) NOT NULL,
    threads integer DEFAULT 0 NOT NULL
);


--
-- Name: tags_tagid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tags_tagid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tags_tagid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tags_tagid_seq OWNED BY public.tags.tagid;


--
-- Name: thread_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thread_tags (
    tid integer NOT NULL,
    tagid integer NOT NULL
);


--
-- Name: threads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.threads (
    tid integer NOT NULL,
    forumid integer DEFAULT 0 NOT NULL,
    toptype smallint DEFAULT 0 NOT NULL,
    ttrash smallint DEFAULT 0 NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    author text DEFAULT ''::text NOT NULL,
    authorid integer DEFAULT 0 NOT NULL,
    "time" integer DEFAULT 0 NOT NULL,
    changetime integer DEFAULT 0 NOT NULL,
    hits integer DEFAULT 0 NOT NULL,
    replys integer DEFAULT 0 NOT NULL,
    lastreply text DEFAULT ''::text NOT NULL,
    islock smallint DEFAULT 0 NOT NULL,
    ttype smallint DEFAULT 0 NOT NULL,
    ttagname character varying(200) DEFAULT ''::character varying NOT NULL,
    ttagid character varying(100) DEFAULT ''::character varying NOT NULL,
    diggcount integer DEFAULT 0 NOT NULL,
    digguser text DEFAULT ''::text NOT NULL,
    newdesc text DEFAULT ''::text NOT NULL,
    digest smallint DEFAULT 0 NOT NULL,
    type smallint DEFAULT 0 NOT NULL
);


--
-- Name: threads_tid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.threads_tid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: threads_tid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.threads_tid_seq OWNED BY public.threads.tid;


--
-- Name: usergroup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usergroup (
    id integer NOT NULL,
    groupname text DEFAULT ''::text NOT NULL,
    groupicon text DEFAULT ''::text NOT NULL,
    showsort integer DEFAULT 0 NOT NULL,
    canview smallint DEFAULT 1 NOT NULL,
    canpost smallint DEFAULT 1 NOT NULL,
    canreply smallint DEFAULT 1 NOT NULL,
    canupload smallint DEFAULT 1 NOT NULL,
    canvote smallint DEFAULT 1 NOT NULL,
    canpm smallint DEFAULT 1 NOT NULL,
    candigg smallint DEFAULT 1 NOT NULL,
    cansearch smallint DEFAULT 1 NOT NULL
);


--
-- Name: userlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.userlist (
    userid integer NOT NULL,
    username character varying(60) NOT NULL,
    pwd text DEFAULT ''::text NOT NULL,
    salt character varying(16) DEFAULT ''::character varying NOT NULL,
    mailadd text DEFAULT ''::text NOT NULL,
    usergroup integer DEFAULT 1 NOT NULL,
    regdate text DEFAULT ''::text NOT NULL,
    signtext text DEFAULT ''::text NOT NULL,
    homepage text DEFAULT ''::text NOT NULL,
    fromwhere text DEFAULT ''::text NOT NULL,
    desper text DEFAULT ''::text NOT NULL,
    headtitle text DEFAULT ''::text NOT NULL,
    postamount integer DEFAULT 0 NOT NULL,
    point integer DEFAULT 0 NOT NULL,
    money integer DEFAULT 0 NOT NULL,
    lastlogin integer DEFAULT 0 NOT NULL,
    lastpost integer DEFAULT 0 NOT NULL,
    avatar text DEFAULT ''::text NOT NULL,
    sex text DEFAULT 'm'::text NOT NULL,
    birthday text DEFAULT ''::text NOT NULL,
    online_status text DEFAULT 'online'::text NOT NULL,
    digestmount integer DEFAULT 0 NOT NULL
);


--
-- Name: userlist_userid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.userlist_userid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: userlist_userid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.userlist_userid_seq OWNED BY public.userlist.userid;


--
-- Name: wordfilter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wordfilter (
    id integer NOT NULL,
    find text NOT NULL,
    replacewith text DEFAULT '*'::text NOT NULL
);


--
-- Name: wordfilter_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wordfilter_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wordfilter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wordfilter_id_seq OWNED BY public.wordfilter.id;


--
-- Name: actlogs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actlogs ALTER COLUMN id SET DEFAULT nextval('public.actlogs_id_seq'::regclass);


--
-- Name: adminlog id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminlog ALTER COLUMN id SET DEFAULT nextval('public.adminlog_id_seq'::regclass);


--
-- Name: announces id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announces ALTER COLUMN id SET DEFAULT nextval('public.announces_id_seq'::regclass);


--
-- Name: attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments ALTER COLUMN id SET DEFAULT nextval('public.attachments_id_seq'::regclass);


--
-- Name: contacts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts ALTER COLUMN id SET DEFAULT nextval('public.contacts_id_seq'::regclass);


--
-- Name: favorites id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites ALTER COLUMN id SET DEFAULT nextval('public.favorites_id_seq'::regclass);


--
-- Name: forumdata id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forumdata ALTER COLUMN id SET DEFAULT nextval('public.forumdata_id_seq'::regclass);


--
-- Name: forumlog id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forumlog ALTER COLUMN id SET DEFAULT nextval('public.forumlog_id_seq'::regclass);


--
-- Name: invitecode id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitecode ALTER COLUMN id SET DEFAULT nextval('public.invitecode_id_seq'::regclass);


--
-- Name: ipban id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ipban ALTER COLUMN id SET DEFAULT nextval('public.ipban_id_seq'::regclass);


--
-- Name: notification nid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification ALTER COLUMN nid SET DEFAULT nextval('public.notification_nid_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: primsg id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.primsg ALTER COLUMN id SET DEFAULT nextval('public.primsg_id_seq'::regclass);


--
-- Name: tags tagid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags ALTER COLUMN tagid SET DEFAULT nextval('public.tags_tagid_seq'::regclass);


--
-- Name: threads tid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.threads ALTER COLUMN tid SET DEFAULT nextval('public.threads_tid_seq'::regclass);


--
-- Name: userlist userid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userlist ALTER COLUMN userid SET DEFAULT nextval('public.userlist_userid_seq'::regclass);


--
-- Name: wordfilter id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wordfilter ALTER COLUMN id SET DEFAULT nextval('public.wordfilter_id_seq'::regclass);


--
-- Data for Name: actlogs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.actlogs VALUES (1, 'bsd_fan 的帖子 #1（编辑后的标题）', 'bsd_fan', '', 1789918828, 1, 'refund');


--
-- Data for Name: adminlog; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.adminlog VALUES (1, 1789911925, 'admin', 'addword', '新增敏感词 回归敏感词XYZ');
INSERT INTO public.adminlog VALUES (2, 1789911925, 'admin', 'ipban', '封禁 IP 前缀 10.99.99.99');
INSERT INTO public.adminlog VALUES (3, 1789911925, 'admin', 'purgeall', '清空回收站');
INSERT INTO public.adminlog VALUES (4, 1789911925, 'admin', 'invitegen', '生成 2 个邀请码');
INSERT INTO public.adminlog VALUES (5, 1789911925, 'admin', 'setperms', '调整用户组 1 权限');
INSERT INTO public.adminlog VALUES (6, 1789911925, 'admin', 'edituser', '编辑用户 bsd_fan 的签名/头衔');
INSERT INTO public.adminlog VALUES (7, 1789911929, 'admin', 'rebuild', '重建统计缓存');
INSERT INTO public.adminlog VALUES (8, 1789912128, 'admin', 'ipban', '封禁 IP 前缀 10.99.99.');
INSERT INTO public.adminlog VALUES (9, 1789912128, 'admin', 'addword', '新增敏感词 回归敏感词XYZ');
INSERT INTO public.adminlog VALUES (10, 1789912128, 'admin', 'invitetoggle', '邀请注册 开启');
INSERT INTO public.adminlog VALUES (11, 1789912128, 'admin', 'setgroup', 'bsd_fan → 用户组 2');
INSERT INTO public.adminlog VALUES (12, 1789912128, 'admin', 'setperms', '调整用户组 1 权限');
INSERT INTO public.adminlog VALUES (13, 1789912128, 'admin', 'invitegen', '生成 2 个邀请码');
INSERT INTO public.adminlog VALUES (14, 1789912128, 'admin', 'ipunban', '解封 IP id=1');
INSERT INTO public.adminlog VALUES (15, 1789912128, 'admin', 'edituser', '编辑用户 bsd_fan 的签名/头衔');
INSERT INTO public.adminlog VALUES (16, 1789912129, 'admin', 'ban', '封禁用户 月光骑士');
INSERT INTO public.adminlog VALUES (17, 1789912129, 'admin', 'unban', '解封用户 月光骑士');
INSERT INTO public.adminlog VALUES (18, 1789912129, 'admin', 'setgroup', 'bsd_fan → 用户组 1');
INSERT INTO public.adminlog VALUES (19, 1789912129, 'admin', 'edituser', '编辑用户 bsd_fan 的签名/头衔');
INSERT INTO public.adminlog VALUES (20, 1789912129, 'admin', 'invitetoggle', '邀请注册 关闭');
INSERT INTO public.adminlog VALUES (21, 1789912129, 'admin', 'restore', '还原主题 tid=13');
INSERT INTO public.adminlog VALUES (22, 1789912129, 'admin', 'purge', '彻底删除主题 tid=13');
INSERT INTO public.adminlog VALUES (23, 1789912129, 'admin', 'purgeall', '清空回收站');
INSERT INTO public.adminlog VALUES (24, 1789912129, 'admin', 'rebuild', '重建统计缓存');
INSERT INTO public.adminlog VALUES (25, 1789912555, 'admin', 'setgroup', 'inv_reg_ok → 用户组 1');
INSERT INTO public.adminlog VALUES (26, 1789913101, 'admin', 'deleteuser', '删除用户 inv_reg_ok');


--
-- Data for Name: announces; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.announces VALUES (1, '欢迎来到 BMForum 复刻版', '本站是 BMForum 7 论坛系统的 TypeScript + PostgreSQL 复刻版，保留了经典的 BSD12 主题风格。注册后即可发帖、回帖、投票、发短消息。', 'admin', 1700000000, '');
INSERT INTO public.announces VALUES (2, '发帖规范提醒', '请勿发布违规内容，尊重他人，维护论坛氛围。BMBCode 语法（[b][i][u][quote][img][url][color]）已支持。', 'admin', 1700100000, '');
INSERT INTO public.announces VALUES (3, '标签功能上线', '发帖时可添加标签（Tags），让帖子联系更紧密，这是 BMForum 的招牌功能！', 'admin', 1700200000, '/tags');


--
-- Data for Name: attachments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.attachments VALUES (3, 0, 0, 'av3.png', 'image/png', 70, 'bsd_fan', 1789912623, 0, 1, '\x89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da636460f85f0f0002870180eb47ba920000000049454e44ae426082');


--
-- Data for Name: banname; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: bbs_config; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.bbs_config VALUES ('short_title', 'BMForum');
INSERT INTO public.bbs_config VALUES ('footer_text', 'Powered by BMForum.com · 本页面为 TypeScript + PostgreSQL 复刻版');
INSERT INTO public.bbs_config VALUES ('bbs_title', 'BMForum 论坛');
INSERT INTO public.bbs_config VALUES ('bbs_des', '复刻自 BMForum 7 · 新版主题 BSD12 风格');


--
-- Data for Name: beg; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: config; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.config VALUES ('invitereg', '0');


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: forumdata; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.forumdata VALUES (20, 'forum', 'PHP / 后端开发', 'PHP、Node.js 等后端技术讨论', 2, 'bsd_fan,php老兵', 1, 2, 1, 0, 0, '从 PHP 迁移到 TypeScript 的心得', 'php老兵', 1700900000, '1', 0);
INSERT INTO public.forumdata VALUES (31, 'forum', '经典怀旧', '追忆老论坛、老软件与互联网记忆', 3, '月光骑士', 2, 1, 0, 0, 0, '晒出你的老论坛收藏：BMForum、Discuz、PHPWind', '月光骑士', 1700860000, '1', 0);
INSERT INTO public.forumdata VALUES (11, 'forum', '意见反馈', '对论坛的建议与意见反馈专区', 1, 'admin,bsd_fan', 2, 2, 0, 1, 0, '建议增加夜间模式', '月光骑士', 1700660000, '0', 0);
INSERT INTO public.forumdata VALUES (30, 'forum', '灌水乐园', '轻松一刻，畅所欲言', 3, '水贴之王', 1, 3, 1, 3, 0, '交易标签功能演示（出售/礼金/求赏）', 'admin', 1789921825, '1', 0);
INSERT INTO public.forumdata VALUES (1, 'category', '站务管理', '论坛公告与管理事务', 0, '', 1, 0, 0, 0, 0, '', '', 0, '1', 0);
INSERT INTO public.forumdata VALUES (2, 'category', '技术交流', '程序开发与设计技术', 0, '', 2, 0, 0, 0, 0, '', '', 0, '1', 0);
INSERT INTO public.forumdata VALUES (3, 'category', '休闲娱乐', '灌水与闲聊', 0, '', 3, 0, 0, 0, 0, '', '', 0, '1', 0);
INSERT INTO public.forumdata VALUES (33, 'forum', 'Linux & Shell', '命令行与脚本玩家的角落', 20, 'admin', 23, 0, 0, 0, 0, '', '', 0, '1', 0);
INSERT INTO public.forumdata VALUES (10, 'forum', '公告与规则', '论坛最新公告、制度与须知，发帖前必读', 1, 'admin', 1, 2, 3, 1, 0, '[公告] BMForum 复刻版正式上线', 'admin', 1700990000, '0', 0);
INSERT INTO public.forumdata VALUES (21, 'forum', '前端与设计', 'HTML/CSS/JS、界面设计与用户体验', 2, 'bsd_fan', 2, 1, 0, 0, 0, '用现代 CSS 复刻 Bootstrap 2 时代界面', 'bsd_fan', 1700800000, '1', 0);
INSERT INTO public.forumdata VALUES (22, 'forum', '数据库专区', 'MySQL、PostgreSQL 等数据库技术', 2, 'php老兵', 3, 1, 1, 3, 0, 'PostgreSQL 17 有哪些值得升级的新特性', 'php老兵', 1700850000, '1', 0);


--
-- Data for Name: forumlog; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.forumlog VALUES (7, 30, 1789921357, '月光骑士', '编辑帖子', '细节冒烟·投票主题（#24）');
INSERT INTO public.forumlog VALUES (8, 30, 1789921630, 'bsd_fan', '编辑帖子', '交易标签功能演示（出售/礼金/求赏）（#22）');
INSERT INTO public.forumlog VALUES (9, 30, 1789921836, 'admin', '删帖', '帖子 #30');


--
-- Data for Name: invitecode; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.invitecode VALUES (4, 'BMF-B592A69C17', '', 0, 1789912128);
INSERT INTO public.invitecode VALUES (3, 'BMF-99E5962686', 'inv_reg_ok', 1789912128, 1789912128);


--
-- Data for Name: ipban; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.ipban VALUES (2, '10.99.99.', '回归测试', 1789912128);


--
-- Data for Name: lastest; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.lastest VALUES (1, 11, 27, 5, 3, 1700990000, 47, 'admin', 1, 1700990000);


--
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notification VALUES (1, 2, 'bsd_fan', 3, 'reply', '回复了你的主题「Node.js 里怎么优雅地写数据库迁移脚本」', 9, 1700890000, 0);
INSERT INTO public.notification VALUES (2, 4, 'php老兵', 2, 'digg', '觉得你的帖子很赞', 3, 1700910000, 0);
INSERT INTO public.notification VALUES (3, 1, 'admin', 3, 'reply', '回复了您的主题「细节冒烟·投票主题」', 16, 1789921171, 0);
INSERT INTO public.notification VALUES (4, 1, 'admin', 3, 'reply', '回复了您的主题「细节冒烟·投票主题」', 16, 1789921417, 0);
INSERT INTO public.notification VALUES (5, 1, 'admin', 2, 'reply', '回复了您的主题「交易标签功能演示（出售/礼金/求赏）」', 15, 1789921825, 0);


--
-- Data for Name: onlinestat; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923016, '127.0.0.1', '/', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923060, '222.128.189.201', '/', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923060, '222.128.189.201', '/', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923066, '222.128.189.201', '/forums/20', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923068, '222.128.189.201', '/topic/9', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923068, '222.128.189.201', '/topic/9', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923071, '127.0.0.1', '/', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923071, '127.0.0.1', '/topic/1', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923071, '127.0.0.1', '/topic/9', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923071, '127.0.0.1', '/topic/8', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923071, '127.0.0.1', '/', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923087, '222.128.189.201', '/forums/20', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923090, '222.128.189.201', '/topic/9', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923092, '222.128.189.201', '/', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923123, '222.128.189.201', '/', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923123, '222.128.189.201', '/', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923126, '222.128.189.201', '/forums/10', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923131, '127.0.0.1', '/', 0);
INSERT INTO public.onlinestat VALUES ('Guest', 0, 1789923588, '127.0.0.1', '/', 0);


--
-- Data for Name: polls; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.polls VALUES (6, '[{"text": "Discuz!", "votes": 2}, {"text": "PHPWind", "votes": 1}, {"text": "BMForum", "votes": 3}, {"text": "phpBB", "votes": 0}, {"text": "动网论坛", "votes": 1}]', '[1, 2, 3, 4, 5, 2, 3]', 2, 1800000000, 0, 0);


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.posts VALUES (3, 1, 10, '', '月光骑士', 3, '签名档功能什么时候上？', 1700020000, 0, 0, '', '', '');
INSERT INTO public.posts VALUES (4, 1, 10, 'RE: 上线公告', '水贴之王', 5, '前排围观，灌水乐园走起！', 1700030000, 0, 0, '', '', '');
INSERT INTO public.posts VALUES (22, 8, 30, '今天天气不错，出来冒个泡', '水贴之王', 5, '如题，今天天气真心不错，阳光明媚，适合出来冒个泡~ [s:1]

大家那边天气怎么样？最近水区有点冷清啊，都出来聊聊。
顺便晒晒今天的随手拍：[img]https://dummyimage.com/480x300/89c4f4/ffffff.png&text=sunny+day[/img]

[s:b]水区日常，勿升精华[/s:b]', 1700900000, 0, 0, '', '', '192.168.1.66');
INSERT INTO public.posts VALUES (23, 9, 20, 'Node.js 里怎么优雅地写数据库迁移脚本', '月光骑士', 3, '最近在把论坛从 PHP 迁到 TypeScript，聊一下数据库迁移脚本的写法心得。

[b]方案一：SQL 文件 + 启动时按序执行[/b]
把 DDL/种子放在 db/schema.sql 和 db/migrate*.sql，启动时检查版本号，按序执行。简单可靠，推荐中小项目。

[b]方案二：migration 框架[/b]
比如 node-pg-migrate / knex，提供 up/down 回滚。团队大了之后有用，但引入依赖较重。

[list][*]迁移必须幂等（IF NOT EXISTS）[*]种子数据与结构分开导出[*]大表加索引记得 CONCURRENTLY[/list]

大家用什么方案？欢迎交流。', 1700850000, 0, 0, '', '', '192.168.1.33');
INSERT INTO public.posts VALUES (11, 3, 20, '', '月光骑士', 3, '请问连接池需要单例吗？', 1700920000, 0, 0, '', '', '');
INSERT INTO public.posts VALUES (27, 15, 30, '交易标签功能演示（出售/礼金/求赏）', 'bsd_fan', 2, '出售与求赏演示。

[sell=20]这段是付费内容：购买后才能看到（演示用，作者可在帖子下方退款）。[/sell]

[beg]觉得有用的话，欢迎打赏楼主～[/beg]', 1789919412, 1789919412, 0, '', '', '127.0.0.1');
INSERT INTO public.posts VALUES (1, 1, 10, '[公告] BMForum 复刻版正式上线', 'bsd_fan', 2, '经过一段时间的努力，BMForum 7 复刻版今天正式上线了！

[b]本次复刻完整还原的功能：[/b]
[list]
[*]经典 BSD12「新版主题」界面，蓝条 #3083BE、970px 居中布局
[*]完整的 BMBCode 标签：加粗/颜色/引用/代码/图片/表情，以及出售 [pay]、礼金 [gift]、求赏 [beg]
[*]投票系统：单选/多选、投票后查看结果、到期截止、最低发帖数
[*]短消息、收藏、举报、验证码、后台管理一应俱全
[/list]

感谢各位老玩家的支持，梦回 2010！发现问题请到建站交流版块反馈。', 1700000000, 0, 0, '', '', '192.168.1.10');
INSERT INTO public.posts VALUES (2, 1, 10, '', 'bsd_fan', 2, '恭喜恭喜！BSD12 主题还原度很高，梦回 2010。', 1700010000, 1700010000, 0, '', '', '');
INSERT INTO public.posts VALUES (5, 1, 10, '', 'php老兵', 4, 'BMBCode 解析器写得很扎实，[url=https://www.bmforum.com]原版官网[/url]的精神续作。', 1700990000, 0, 0, '', '', '');
INSERT INTO public.posts VALUES (6, 2, 10, '[公告] 论坛发帖规范 v2', '水贴之王', 5, '为维护社区氛围，论坛发帖规范 v2 发布如下：

[b]1.[/b] 标题请描述清楚问题，拒绝「求救」「高手进」
[b]2.[/b] 技术问题请到对应版块发帖，勿跨区
[b]3.[/b] 禁止发布广告、灌水机行为，违者封禁
[b]4.[/b] 转载内容请注明出处

[color=red]请各位自觉遵守，多次违规将禁言处理。[/color]', 1699000000, 0, 0, '', '', '192.168.1.55');
INSERT INTO public.posts VALUES (7, 2, 10, '', '水贴之王', 5, '收到，一定遵守规范。', 1699010000, 0, 0, '', '', '');
INSERT INTO public.posts VALUES (8, 3, 20, '从 PHP 到 TypeScript 的迁移心得', 'bsd_fan', 2, '把论坛从 PHP 5.2 迁移到 TypeScript 的过程记录一下。

[b]架构选择[/b]
最终用了 Next.js App Router + 原生 PostgreSQL 参数化查询，服务端组件直连数据库，省掉一层 API。

[b]类型收窄[/b]
原来 PHP 的数组乱来惯了，TS 里严格模式会教你重新做人。所有查询结果先定义 interface，参数全部显式标注。

[code]const rows = await query<PostRow>(
  "SELECT tid, title FROM threads WHERE forumid = $1", [fid]
);[/code]

[b]总结[/b]
迁移虽苦，但静态检查和 IDE 补全带来的收益远超预期。有疑问回帖交流。', 1700500000, 0, 0, '', '', '192.168.1.10');
INSERT INTO public.posts VALUES (9, 3, 20, '', 'php老兵', 4, '需要的，全局 Pool 复用即可，参考我的帖子里的写法。', 1700900000, 0, 0, '', '', '');
INSERT INTO public.posts VALUES (10, 3, 20, 'RE: 迁移心得', 'bsd_fan', 2, '同感。原生 SQL + 参数化查询在服务端组件里直接 await，太爽了。', 1700910000, 0, 0, '', '', '');
INSERT INTO public.posts VALUES (13, 4, 22, 'RE: PG 17', 'admin', 1, '我们论坛就是 PG 17 跑的，稳。', 1700851000, 0, 0, '', '', '');
INSERT INTO public.posts VALUES (12, 4, 22, 'PostgreSQL 17 有哪些值得升级的新特性', 'admin', 1, 'PG 17 已经发布一段时间了，总结几个值得关注的特性：

[b]1. VACUUM 内存优化[/b]
新的 vacuum 内存策略让大表维护快了很多。

[b]2. 增量备份（pg_basebackup）[/b]
内置增量备份终于来了，不再必须上 pgBackRest。

[b]3. MERGE 命令增强[/b]
RETURNING 支持让 upsert 场景更顺手。

[b]4. 逻辑复制改进[/b]
故障切换后订阅不再需要重建。

我们论坛就是 PG 17 跑的，目前稳定。大家升级过程遇到什么坑欢迎交流。', 1700600000, 0, 0, '', '', '127.0.0.1');
INSERT INTO public.posts VALUES (14, 4, 22, '', '月光骑士', 3, '还在 16，观察一波再说。', 1700852000, 0, 0, '', '', '');
INSERT INTO public.posts VALUES (15, 5, 21, '用现代 CSS 复刻 Bootstrap 2 时代界面', '月光骑士', 3, '最近用 Tailwind 4 复刻了 Bootstrap 2 的论坛界面，总结一些复刻技巧。

[b]配色[/b]
经典 navbar 渐变 #333333 → #222222，栏目头 #3083BE 实色 + 白字加粗，行悬停 #F0F0F0。

[b]圆角[/b]
那个年代圆角只有 3px，别用现在流行的 12px，气质完全不对。

[b]表格感[/b]
1px #DDD 边框 + 斑马纹 #F9F9F9，紧凑 12-13px 字号，这些是「表格时代」的灵魂。

蓝条 #3083BE 一出来，DNA 动了。大家还想看哪些经典界面的复刻？', 1700700000, 0, 0, '', '', '192.168.1.33');
INSERT INTO public.posts VALUES (16, 5, 21, '', '月光骑士', 3, '蓝条 #3083BE 一出来，DNA 动了。', 1700801000, 0, 0, '', '', '');
INSERT INTO public.posts VALUES (17, 6, 30, '[投票] 你最早用的论坛程序是哪个？', 'php老兵', 4, '看到版块里聊起各自的老论坛，干脆开个投票：

你人生中第一个注册的论坛是用什么程序搭的？

[list]
[*]Discuz! —— 论坛界的国民级
[*]PHPWind —— 阿里系，当年与 DZ 分庭抗礼
[*]BMForum —— 标签功能首创，BSD 模板经典
[*]phpBB —— 国际范，插件生态庞大
[*]其他 —— 动网、雷傲、CTB……欢迎回帖补充
[/list]

老玩家们来投一票，顺便讲讲你和它的故事。', 1700750000, 0, 0, '', '', '192.168.1.44');
INSERT INTO public.posts VALUES (18, 6, 30, '', 'php老兵', 4, 'Discuz！当年大学 BBS 全靠它。', 1700881000, 0, 0, '', '', '');
INSERT INTO public.posts VALUES (19, 6, 30, '', '月光骑士', 3, 'PHPWind 也有，界面很清新。', 1700882000, 0, 0, '', '', '');
INSERT INTO public.posts VALUES (20, 7, 31, '晒出你的老论坛收藏：BMForum、Discuz、PHPWind', 'php老兵', 4, '收拾硬盘翻出当年的论坛程序安装包，晒一下收藏：

[b]BMForum 7[/b]
BSD12 模板 + 标签系统，国内首创标签功能，evidence 还在硬盘里躺着。

[b]Discuz! 6.0[/b]
真正的国民论坛，UCenter 整合那是当年的标配。

[b]PHPWind 8.5[/b]
界面精致，模版引擎当时很先进。

[b]动网论坛 DVBBS[/b]
ASP 时代霸主，多少人第一个论坛是它。

你们的收藏呢？欢迎晒图。', 1700800000, 0, 0, '', '', '192.168.1.44');
INSERT INTO public.posts VALUES (21, 7, 31, '', 'php老兵', 4, 'BMForum 的标签功能当年是国内首创，超前了。', 1700861000, 0, 0, '', '', '');
INSERT INTO public.posts VALUES (24, 10, 11, '建议增加夜间模式', 'admin', 1, '看了下站里的活跃时间，晚上 10 点以后发帖占比很高，建议考虑加一个夜间模式。

初步想法：
1. 换一套低亮度配色（背景 #222，文字 #ccc）
2. 站点设置里加开关，会员可以在控制面板自选
3. 头部导航加一个快速切换按钮

大家觉得怎么样？欢迎在下面回帖讨论。', 1700650000, 0, 0, '', '', '127.0.0.1');
INSERT INTO public.posts VALUES (25, 10, 11, '', 'admin', 1, '收到建议，已列入计划，感谢反馈。', 1700661000, 0, 0, '', '', '');
INSERT INTO public.posts VALUES (26, 15, 30, '交易标签功能演示（出售/礼金/求赏）', 'bsd_fan', 2, '[gift=10]感谢大家参与本版块的交易功能测试！[/gift]', 1789919379, 1789921630, 0, '', '1789921630|bsd_fan', '127.0.0.1');


--
-- Data for Name: primsg; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.primsg VALUES (1, '月光骑士', 'admin', '月光骑士', '欢迎加入 BMForum', '欢迎注册本论坛，有问题随时反馈！', 1700100000, 1, 'r');
INSERT INTO public.primsg VALUES (2, 'admin', '月光骑士', 'admin', 'RE: 欢迎加入', '谢谢管理员！', 1700150000, 1, 'r');
INSERT INTO public.primsg VALUES (3, '月光骑士', 'bsd_fan', '月光骑士', '一起搞复古皮肤吗', '看到你在怀旧区的帖子，有兴趣一起复刻 bsd07 吗？', 1700200000, 0, 'r');
INSERT INTO public.primsg VALUES (5, 'bsd_fan', 'bsd_fan', 'admin', '回归消息', '回归测试内容', 1789912129, 0, 's');
INSERT INTO public.primsg VALUES (4, 'admin', 'bsd_fan', 'admin', '回归消息', '回归测试内容', 1789912129, 1, 'r');
INSERT INTO public.primsg VALUES (7, 'admin', 'admin', 'inv_reg_ok', 'probe', 'probe', 1789912555, 0, 's');


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sessions VALUES ('6c2d813c2fea63c17035aaf7fca51bd1ceaa370649677b77', 1, 1789915328, 1789915328, '127.0.0.1');
INSERT INTO public.sessions VALUES ('10916ed22c47a3b5b7053de4afef75cca5768b6da35fc1ac', 2, 1789918746, 1789918746, '127.0.0.1');
INSERT INTO public.sessions VALUES ('51db83a5294a6672c69c2e7414b9ca25fbc30dbe7ac38585', 3, 1789918747, 1789918747, '127.0.0.1');
INSERT INTO public.sessions VALUES ('e3a440e7b41934a0464e13a39fead23caa4c5b335ee5a254', 2, 1789918828, 1789918828, '127.0.0.1');
INSERT INTO public.sessions VALUES ('6535d48a55b8f05c3df5990909970215ac87bebd31527be0', 3, 1789918828, 1789918828, '127.0.0.1');
INSERT INTO public.sessions VALUES ('f395ebd7ce9c3da0abe5507342e8db7ce1453b1efb42bf60', 2, 1789918979, 1789918979, '127.0.0.1');
INSERT INTO public.sessions VALUES ('ae13711dc7fde332b7ad126c9c94a944b33dc93ce966b84f', 1, 1789918979, 1789918979, '127.0.0.1');
INSERT INTO public.sessions VALUES ('94a41bdba604ba812da1a195f66d2ae2978294a45ff56a65', 1, 1789919172, 1789919172, '127.0.0.1');
INSERT INTO public.sessions VALUES ('b8724b0ea68ef2a6264072e8354b296edce7900d9526f7a4', 2, 1789919212, 1789919212, '127.0.0.1');
INSERT INTO public.sessions VALUES ('ee42e887e710cefacdeb9550490ebf52c6851fc51bf3093f', 2, 1789919237, 1789919237, '127.0.0.1');
INSERT INTO public.sessions VALUES ('74a51e763051b17ca4f5b77a46274acf95ef3333c6fce2d9', 2, 1789919379, 1789919379, '127.0.0.1');
INSERT INTO public.sessions VALUES ('17cc4acccd3e517de49ff13b79ed2be00f36214c3c045d4d', 1, 1789921141, 1789921141, '127.0.0.1');
INSERT INTO public.sessions VALUES ('d74c7584d64842a9df2211f1989d02c8671f905b84a41049', 3, 1789921141, 1789921141, '127.0.0.1');
INSERT INTO public.sessions VALUES ('5ec242b9eab7f6ecccac40fb55a6a37a8931fbfcffda6500', 2, 1789921630, 1789921630, '127.0.0.1');
INSERT INTO public.sessions VALUES ('f481c5edd999bdae2265bdeba83d783016a2e3debc0180d1', 3, 1789923602, 1789923602, '127.0.0.1');


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tags VALUES (2, '经典论坛', 2);
INSERT INTO public.tags VALUES (3, 'PHP', 2);
INSERT INTO public.tags VALUES (4, 'PostgreSQL', 3);
INSERT INTO public.tags VALUES (5, '前端', 1);
INSERT INTO public.tags VALUES (6, '怀旧', 3);
INSERT INTO public.tags VALUES (7, '灌水', 2);
INSERT INTO public.tags VALUES (17, '冒烟', 1);
INSERT INTO public.tags VALUES (1, 'BMForum', 2);
INSERT INTO public.tags VALUES (8, '公告', 2);


--
-- Data for Name: thread_tags; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.thread_tags VALUES (2, 8);
INSERT INTO public.thread_tags VALUES (3, 3);
INSERT INTO public.thread_tags VALUES (3, 4);
INSERT INTO public.thread_tags VALUES (4, 4);
INSERT INTO public.thread_tags VALUES (5, 5);
INSERT INTO public.thread_tags VALUES (5, 6);
INSERT INTO public.thread_tags VALUES (6, 7);
INSERT INTO public.thread_tags VALUES (6, 6);
INSERT INTO public.thread_tags VALUES (7, 6);
INSERT INTO public.thread_tags VALUES (7, 1);
INSERT INTO public.thread_tags VALUES (7, 2);
INSERT INTO public.thread_tags VALUES (8, 7);
INSERT INTO public.thread_tags VALUES (9, 4);
INSERT INTO public.thread_tags VALUES (9, 3);
INSERT INTO public.thread_tags VALUES (10, 2);
INSERT INTO public.thread_tags VALUES (1, 1);
INSERT INTO public.thread_tags VALUES (1, 8);


--
-- Data for Name: threads; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.threads VALUES (6, 30, 0, 0, '[投票] 你最早用的论坛程序是哪个？', '来投个票，看看大家都是从什么年代过来的！', 'php老兵', 4, 1700750000, 1700880000, 313, 2, '月光骑士', 0, 1, '灌水,怀旧', '7,6', 15, '', '', 0, 1);
INSERT INTO public.threads VALUES (2, 10, 1, 0, '[公告] 论坛发帖规范 v2', '为维护论坛秩序，请遵守以下规范：[quote]1. 禁止灌水广告；2. 标题明确；3. 尊重他人[/quote]违规将被扣分处理。', '水贴之王', 5, 1699000000, 1699000000, 263, 1, '水贴之王', 0, 0, '公告', '8', 5, '', '', 0, 0);
INSERT INTO public.threads VALUES (3, 20, 0, 0, '从 PHP 迁移到 TypeScript 的心得', '十年 PHP 老兵表示：[b]TypeScript 的类型系统真的香[/b]。用 node-postgres 原生驱动连接 PG，配合 Next.js 服务端组件，开发体验拉满。附上连接池代码：[code]import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { rows } = await pool.query("SELECT * FROM threads LIMIT 10");[/code]', 'bsd_fan', 2, 1700500000, 1700900000, 189, 3, 'bsd_fan', 0, 0, 'PHP,PostgreSQL', '3,4', 8, '', '', 0, 0);
INSERT INTO public.threads VALUES (4, 22, 0, 0, 'PostgreSQL 17 有哪些值得升级的新特性', 'PG 17 的 VACUUM 性能提升、MERGE 增强都很实用。大家的生产环境都升级了吗？', 'admin', 1, 1700600000, 1700850000, 143, 2, 'admin', 0, 0, 'PostgreSQL', '4', 6, '', '', 0, 0);
INSERT INTO public.threads VALUES (5, 21, 0, 0, '用现代 CSS 复刻 Bootstrap 2 时代界面', '渐变按钮、圆角输入框、table 布局……复刻老论坛界面比想象中有趣。核心是把 .announcement 蓝条还原出来。', '月光骑士', 3, 1700700000, 1700800000, 98, 1, '月光骑士', 0, 0, '前端,怀旧', '5,6', 4, '', '', 0, 0);
INSERT INTO public.threads VALUES (15, 30, 0, 0, '交易标签功能演示（出售/礼金/求赏）', '本帖演示原版 BMForum 的三大交易标签。

[gift=10]礼金演示：楼主可以用 [gift=金额] 给回复的会员发放礼金，点击下方帖子右下角的“发礼金”即可。[/gift]', 'bsd_fan', 2, 1789919379, 1789921825, 10, 1, 'admin', 0, 0, '', '', 0, '', '演示出售、礼金、求赏三种交易标签的实际效果。', 0, 0);
INSERT INTO public.threads VALUES (7, 31, 0, 0, '晒出你的老论坛收藏：BMForum、Discuz、PHPWind', '那些年的三大 PHP 论坛程序，谁还记得「主题随意贴」这个功能？', 'php老兵', 4, 1700800000, 1700860000, 176, 1, 'php老兵', 0, 0, '怀旧,BMForum,经典论坛', '6,1,2', 9, '', '', 0, 0);
INSERT INTO public.threads VALUES (10, 11, 0, 0, '建议增加夜间模式', '如题，晚上看论坛太亮了。', 'admin', 1, 1700650000, 1700660000, 45, 1, 'admin', 0, 0, '经典论坛', '2', 3, '', '', 0, 0);
INSERT INTO public.threads VALUES (1, 10, 0, 0, '[公告] BMForum 复刻版正式上线', '经过努力，BMForum 7 的 TypeScript + PostgreSQL 复刻版正式上线！[b]功能包括：[/b][list]分类版块、主题回帖、BMBCode、标签、投票、短消息、在线列表、后台管理[/list]欢迎体验。', 'bsd_fan', 2, 1700000000, 1700000000, 378, 4, '月光骑士', 0, 0, 'BMForum,公告', '1,8', 12, '', '', 1, 0);
INSERT INTO public.threads VALUES (8, 30, 0, 0, '今天天气不错，出来冒个泡', '水一水，涨积分。', '水贴之王', 5, 1700900000, 1700910000, 89, 0, '', 0, 0, '灌水', '7', 1, '', '', 0, 0);
INSERT INTO public.threads VALUES (9, 20, 0, 0, 'Node.js 里怎么优雅地写数据库迁移脚本', '用纯 SQL 文件 + 启动脚本执行，比 ORM 迁移更直观，大家怎么看？', '月光骑士', 3, 1700850000, 1700890000, 72, 0, '', 0, 0, 'PostgreSQL,PHP', '4,3', 2, '', '', 0, 0);


--
-- Data for Name: usergroup; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.usergroup VALUES (2, '版主', 'moderator.gif', 2, 1, 1, 1, 1, 1, 1, 1, 1);
INSERT INTO public.usergroup VALUES (3, '管理员', 'administrator.gif', 3, 1, 1, 1, 1, 1, 1, 1, 1);
INSERT INTO public.usergroup VALUES (4, '封禁用户', 'ban.gif', 4, 1, 0, 0, 0, 0, 0, 0, 0);
INSERT INTO public.usergroup VALUES (0, '游客', 'guest.gif', 0, 1, 0, 0, 0, 0, 0, 1, 1);
INSERT INTO public.usergroup VALUES (1, '注册会员', 'member.gif', 1, 1, 1, 1, 1, 1, 1, 1, 1);


--
-- Data for Name: userlist; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.userlist VALUES (4, 'php老兵', 'ba1aad78143ff79ea54d0ce560f614d1e9df4411895585e8b2b29f8513c2eeb3', 'b19780dd588bf92a', 'vet@bmforum.dev', 1, '2008-06-30', 'PHP 是世界上最好的语言（狗头）', '', '北京', '写了十年 PHP 的老码农。', '', 67, 2300, 8800, 0, 0, '', 'm', '1983-04-18', 'online', 0);
INSERT INTO public.userlist VALUES (5, '水贴之王', 'f985c790e3b1be6b47acfa0f01b7a3c5819315d76755943378f77a7264ef03a4', '02d97f9930d30498', 'water@bmforum.dev', 1, '2015-02-14', '灌水使我快乐。', '', '成都', '专业灌水二十年。', '', 210, 800, 3200, 0, 0, '', 'm', '1995-12-05', 'online', 0);
INSERT INTO public.userlist VALUES (2, 'bsd_fan', '86fc166b5d369a32e44ade07d8169da349350020e19dc2b9ddd3f3bbb7ab3e1c', '193e9b0d3b521e83', 't@t.io', 1, '2007-03-15', '', '', '测试城市', '老论坛程序爱好者，收集各种经典皮肤。', '', 88, 3200, 11989, 1789921630, 1789919412, '/api/attachment/3', '男', '1990-01-01', 'online', 0);
INSERT INTO public.userlist VALUES (3, '月光骑士', 'ba7b727f23f1f124b85fabcb7e4ec02211d3ac420068539db35ba6c35904aac7', 'e36a14496163a9b4', 'moon@bmforum.dev', 1, '2010-11-02', '潜水多年，偶尔冒泡。', '', '广州', '普通坛友一枚。', '', 47, 1500, 5600, 1789923602, 1789918828, '', 'f', '1990-09-21', 'online', 0);
INSERT INTO public.userlist VALUES (1, 'admin', '6cfeb1231cb191068c8ddd4d13e003c65db3c30c9fe7835854c8ca71f0fef54c', 'e188080bae72e078', 'admin@bmforum.dev', 3, '2005-08-01', '论坛的管理员，有问题请找我。', '', '管理后台', '负责论坛日常维护与安全管理。', '管理员', 132, 9999, 50011, 1789921141, 1789919172, '', 'm', '1980-01-01', 'online', 0);


--
-- Data for Name: wordfilter; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.wordfilter VALUES (1, '垃圾广告', '**');
INSERT INTO public.wordfilter VALUES (2, '混蛋', '**');


--
-- Name: actlogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.actlogs_id_seq', 1, true);


--
-- Name: adminlog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.adminlog_id_seq', 29, true);


--
-- Name: announces_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.announces_id_seq', 4, true);


--
-- Name: attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attachments_id_seq', 3, true);


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contacts_id_seq', 3, true);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.favorites_id_seq', 4, true);


--
-- Name: forumdata_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.forumdata_id_seq', 37, true);


--
-- Name: forumlog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.forumlog_id_seq', 9, true);


--
-- Name: invitecode_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invitecode_id_seq', 4, true);


--
-- Name: ipban_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ipban_id_seq', 2, true);


--
-- Name: notification_nid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notification_nid_seq', 5, true);


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.posts_id_seq', 27, true);


--
-- Name: primsg_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.primsg_id_seq', 10, true);


--
-- Name: tags_tagid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tags_tagid_seq', 19, true);


--
-- Name: threads_tid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.threads_tid_seq', 19, true);


--
-- Name: userlist_userid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.userlist_userid_seq', 12, true);


--
-- Name: wordfilter_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wordfilter_id_seq', 4, true);


--
-- Name: actlogs actlogs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actlogs
    ADD CONSTRAINT actlogs_pkey PRIMARY KEY (id);


--
-- Name: adminlog adminlog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminlog
    ADD CONSTRAINT adminlog_pkey PRIMARY KEY (id);


--
-- Name: announces announces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announces
    ADD CONSTRAINT announces_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: banname banname_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banname
    ADD CONSTRAINT banname_pkey PRIMARY KEY (name);


--
-- Name: bbs_config bbs_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bbs_config
    ADD CONSTRAINT bbs_config_pkey PRIMARY KEY (key);


--
-- Name: beg beg_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beg
    ADD CONSTRAINT beg_pkey PRIMARY KEY (id);


--
-- Name: config config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config
    ADD CONSTRAINT config_pkey PRIMARY KEY (key);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: forumdata forumdata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forumdata
    ADD CONSTRAINT forumdata_pkey PRIMARY KEY (id);


--
-- Name: forumlog forumlog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forumlog
    ADD CONSTRAINT forumlog_pkey PRIMARY KEY (id);


--
-- Name: invitecode invitecode_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitecode
    ADD CONSTRAINT invitecode_code_key UNIQUE (code);


--
-- Name: invitecode invitecode_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitecode
    ADD CONSTRAINT invitecode_pkey PRIMARY KEY (id);


--
-- Name: ipban ipban_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ipban
    ADD CONSTRAINT ipban_pkey PRIMARY KEY (id);


--
-- Name: lastest lastest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lastest
    ADD CONSTRAINT lastest_pkey PRIMARY KEY (id);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (nid);


--
-- Name: polls polls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT polls_pkey PRIMARY KEY (tid);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: primsg primsg_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.primsg
    ADD CONSTRAINT primsg_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tagid);


--
-- Name: tags tags_tagname_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_tagname_key UNIQUE (tagname);


--
-- Name: thread_tags thread_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_tags
    ADD CONSTRAINT thread_tags_pkey PRIMARY KEY (tid, tagid);


--
-- Name: threads threads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_pkey PRIMARY KEY (tid);


--
-- Name: usergroup usergroup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usergroup
    ADD CONSTRAINT usergroup_pkey PRIMARY KEY (id);


--
-- Name: userlist userlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userlist
    ADD CONSTRAINT userlist_pkey PRIMARY KEY (userid);


--
-- Name: userlist userlist_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userlist
    ADD CONSTRAINT userlist_username_key UNIQUE (username);


--
-- Name: wordfilter wordfilter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wordfilter
    ADD CONSTRAINT wordfilter_pkey PRIMARY KEY (id);


--
-- Name: contacts_owner_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contacts_owner_idx ON public.contacts USING btree (owner, contacts, type);


--
-- Name: idx_fav_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fav_owner ON public.favorites USING btree (owner);


--
-- Name: idx_forumdata_cid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forumdata_cid ON public.forumdata USING btree (forum_cid);


--
-- Name: idx_forumdata_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forumdata_order ON public.forumdata USING btree (showorder);


--
-- Name: idx_notif_receiver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notif_receiver ON public.notification USING btree (receiverid, "timestamp");


--
-- Name: idx_online_ts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_online_ts ON public.onlinestat USING btree ("timestamp");


--
-- Name: idx_posts_tid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_tid ON public.posts USING btree (tid, id);


--
-- Name: idx_posts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_user ON public.posts USING btree (usrid);


--
-- Name: idx_primsg_belong; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_primsg_belong ON public.primsg USING btree (belong, prtime);


--
-- Name: idx_primsg_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_primsg_sender ON public.primsg USING btree (sender, prtime);


--
-- Name: idx_thread_tags_tag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_tags_tag ON public.thread_tags USING btree (tagid);


--
-- Name: idx_threads_change; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_threads_change ON public.threads USING btree (changetime);


--
-- Name: idx_threads_forum; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_threads_forum ON public.threads USING btree (forumid, toptype, ttrash, changetime);


--
-- Name: idx_threads_tagid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_threads_tagid ON public.threads USING btree (ttagid);


--
-- Name: idx_userlist_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_userlist_group ON public.userlist USING btree (usergroup);


--
-- PostgreSQL database dump complete
--

\unrestrict 4sFu0eB1egnCpa2RIlnbNpRK4EkbK3eNCsz3HAERAJbdwD61px52QzzqnRo4k6A

