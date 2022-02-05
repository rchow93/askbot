/* 
Calculates text search vector for the user profile
the searched fields are: 
1) user name
2) user profile
3) group names - for groups to which user belongs
*/
CREATE OR REPLACE FUNCTION column_exists(colname text, tablename text)
RETURNS boolean AS 
$$
DECLARE
    q text;
    onerow record;
BEGIN

    q = 'SELECT attname FROM pg_attribute WHERE attrelid = ( SELECT oid FROM pg_class WHERE relname = '''||tablename||''') AND attname = '''||colname||''''; 

    FOR onerow IN EXECUTE q LOOP
        RETURN true;
    END LOOP;

    RETURN false;
END;
$$ LANGUAGE plpgsql;

/* function adding tsvector column to table if it does not exists */
CREATE OR REPLACE FUNCTION add_tsvector_column(colname text, tablename text)
RETURNS boolean AS
$$
DECLARE
    q text;
BEGIN
    IF NOT column_exists(colname, tablename) THEN
        q = 'ALTER TABLE ' || tablename || ' ADD COLUMN ' || colname || ' tsvector';
        EXECUTE q;
        RETURN true;
    ELSE
        q = 'UPDATE ' || tablename || ' SET ' || colname || '=NULL';
        EXECUTE q;
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION get_auth_user_tsv(user_id integer)
RETURNS tsvector AS
$$
DECLARE
    group_query text;
    user_query text;
    user_about_query text;
    onerow record;
    tsv tsvector;
BEGIN
    group_query = 'SELECT user_group.name as group_name ' ||
        'FROM auth_group AS user_group ' ||
        'INNER JOIN auth_user_groups AS gm ' ||
        'ON gm.user_id= ' || user_id || ' AND gm.group_id=user_group.id';

    tsv = to_tsvector('');
    FOR onerow in EXECUTE group_query LOOP
        tsv = tsv || to_tsvector(onerow.group_name);
    END LOOP;

    user_about_query = 'SELECT about FROM askbot_localizeduserprofile ' ||
        'WHERE auth_user_id=' || user_id;

    FOR onerow in EXECUTE user_about_query LOOP
        tsv = tsv || to_tsvector(onerow.about);
    END LOOP;

    user_query = 'SELECT username, p.real_name, email ' ||
        'FROM auth_user ' ||
        'INNER JOIN askbot_userprofile AS p ON id=p.auth_user_ptr_id ' ||
        'WHERE id=' || user_id;
    FOR onerow in EXECUTE user_query LOOP
        tsv = tsv || 
            to_tsvector(onerow.username) || 
            to_tsvector(onerow.real_name) ||
            to_tsvector(onerow.email);
    END LOOP;
    RETURN tsv;
END;
$$ LANGUAGE plpgsql;

/* create tsvector columns in the content tables */
SELECT add_tsvector_column('text_search_vector', 'auth_user');

/* populate tsvectors with data */
UPDATE auth_user SET text_search_vector = get_auth_user_tsv(id);

/* one trigger per table for tsv updates */

/* set up auth_user triggers */
CREATE OR REPLACE FUNCTION auth_user_tsv_update_handler()
RETURNS trigger AS
$$
BEGIN
    new.text_search_vector = get_auth_user_tsv(new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS auth_user_tsv_update_trigger ON auth_user;

CREATE TRIGGER auth_user_tsv_update_trigger
BEFORE INSERT OR UPDATE ON auth_user 
FOR EACH ROW EXECUTE PROCEDURE auth_user_tsv_update_handler();

/* localized user profile trigger */
CREATE OR REPLACE FUNCTION localizeduserprofile_tsv_update_handler()
RETURNS trigger AS
$$
DECLARE
    tsv tsvector;
    user_query text;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        user_query = 'UPDATE auth_user SET username=username WHERE ' ||
            'id=' || new.auth_user_id;
    ELSE
        user_query = 'UPDATE auth_user SET username=username WHERE ' ||
            'id=' || old.auth_user_id;
    END IF;
    /* just trigger the tsv update on user */
    EXECUTE user_query;
    IF (TG_OP = 'INSERT') THEN
        RETURN new;
    ELSE
        RETURN old;
    END IF;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS localizeduserprofile_tsv_update_trigger ON askbot_localizeduserprofile;

CREATE TRIGGER localizeduserprofile_tsv_update_trigger
AFTER INSERT OR UPDATE ON askbot_localizeduserprofile
FOR EACH ROW EXECUTE PROCEDURE localizeduserprofile_tsv_update_handler();

/* group membership trigger - reindex users when group membership
 * changes */
CREATE OR REPLACE FUNCTION group_membership_tsv_update_handler()
RETURNS trigger AS
$$
DECLARE
    tsv tsvector;
    user_query text;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        user_query = 'UPDATE auth_user SET username=username WHERE ' ||
            'id=' || new.user_id;
    ELSE
        user_query = 'UPDATE auth_user SET username=username WHERE ' ||
            'id=' || old.user_id;
    END IF;
    /* just trigger the tsv update on user */
    EXECUTE user_query;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS group_membership_tsv_update_trigger
ON auth_user_groups;

CREATE TRIGGER group_membership_tsv_update_trigger
AFTER INSERT OR DELETE
ON auth_user_groups
FOR EACH ROW EXECUTE PROCEDURE group_membership_tsv_update_handler();

/* todo: whenever group name changes - also 
 * reindex users belonging to the group */

DROP INDEX IF EXISTS auth_user_search_idx;

CREATE INDEX auth_user_search_idx ON auth_user
USING gin(text_search_vector);
