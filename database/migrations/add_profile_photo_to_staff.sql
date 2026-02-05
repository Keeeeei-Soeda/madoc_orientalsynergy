-- スタッフテーブルにprofile_photoカラムを追加
-- 実行日: 2026-02-05

-- profile_photoカラムを追加（既に存在する場合はスキップ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'profile_photo'
    ) THEN
        ALTER TABLE staff ADD COLUMN profile_photo VARCHAR(255);
        COMMENT ON COLUMN staff.profile_photo IS 'プロフィール写真URL';
        RAISE NOTICE 'profile_photoカラムを追加しました';
    ELSE
        RAISE NOTICE 'profile_photoカラムは既に存在します';
    END IF;
END $$;

