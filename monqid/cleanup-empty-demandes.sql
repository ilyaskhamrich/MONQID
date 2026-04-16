-- احذف من phpMyAdmin الطلبات اللي كل الحقول الأساسية فيها فاضية (تجارب / أخطاء قديمة)
-- راجعي النتيجة بـ SELECT قبل التنفيذ إلا بغيتي تشوفي شنو غادي يتمسح

-- معاينة (شغّلي هاد السطر الأول بلا DELETE):
-- SELECT id, patient_name, hospital, blood_type, city, phone, created_at FROM demandes
-- WHERE TRIM(COALESCE(patient_name, '')) = ''
--    OR TRIM(COALESCE(hospital, '')) = ''
--    OR TRIM(COALESCE(blood_type, '')) = ''
--    OR TRIM(COALESCE(city, '')) = ''
--    OR TRIM(COALESCE(phone, '')) = '';

DELETE FROM demandes
WHERE TRIM(COALESCE(patient_name, '')) = ''
   OR TRIM(COALESCE(hospital, '')) = ''
   OR TRIM(COALESCE(blood_type, '')) = ''
   OR TRIM(COALESCE(city, '')) = ''
   OR TRIM(COALESCE(phone, '')) = '';
