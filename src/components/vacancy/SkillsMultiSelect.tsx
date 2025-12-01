import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
} from 'react-native';
import { theme } from '../../constants';
import { COMMON_SKILLS } from '../../constants/vacancyOptions';

interface SkillsMultiSelectProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
}

export const SkillsMultiSelect: React.FC<SkillsMultiSelectProps> = ({
  selectedSkills = [],
  onSkillsChange,
}) => {
  const [customSkill, setCustomSkill] = useState('');
  const [showAllSkills, setShowAllSkills] = useState(false);

  const safeSelectedSkills = selectedSkills || [];

  const toggleSkill = (skill: string) => {
    if (safeSelectedSkills.includes(skill)) {
      onSkillsChange(safeSelectedSkills.filter((s) => s !== skill));
    } else {
      onSkillsChange([...safeSelectedSkills, skill]);
    }
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !safeSelectedSkills.includes(customSkill.trim())) {
      onSkillsChange([...safeSelectedSkills, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    onSkillsChange(safeSelectedSkills.filter((s) => s !== skill));
  };

  // Получаем пользовательские навыки (не из стандартного списка)
  const customSkills = safeSelectedSkills.filter(
    (skill) => !COMMON_SKILLS.includes(skill)
  );

  return (
    <View style={styles.container}>
      {/* Ваши навыки (пользовательские) */}
      {customSkills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ваши навыки</Text>
          <View style={styles.skillsGrid}>
            {customSkills.map((skill) => (
              <TouchableOpacity
                key={skill}
                style={styles.customSkillChip}
                onPress={() => removeSkill(skill)}
                activeOpacity={0.7}
              >
                <Text style={styles.customSkillText}>{skill}</Text>
                <Text style={styles.removeIcon}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Популярные навыки */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Популярные навыки</Text>
        <View style={styles.skillsGrid}>
          {COMMON_SKILLS.slice(0, 10).map((skill) => (
            <TouchableOpacity
              key={skill}
              style={[
                styles.skillChip,
                safeSelectedSkills.includes(skill) && styles.skillChipSelected,
              ]}
              onPress={() => toggleSkill(skill)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.skillChipText,
                  safeSelectedSkills.includes(skill) && styles.skillChipTextSelected,
                ]}
              >
                {skill}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAllSkills(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.showMoreText}>Показать все навыки</Text>
        </TouchableOpacity>
      </View>

      {/* Добавить свой навык */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Добавить свой навык</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={customSkill}
            onChangeText={setCustomSkill}
            placeholder="Введите навык"
            placeholderTextColor="#9CA3AF"
            onSubmitEditing={addCustomSkill}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={addCustomSkill}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Модальное окно со всеми навыками */}
      <Modal
        visible={showAllSkills}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAllSkills(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Все навыки</Text>
            <TouchableOpacity
              onPress={() => setShowAllSkills(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={COMMON_SKILLS}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalSkill,
                  safeSelectedSkills.includes(item) && styles.modalSkillSelected,
                ]}
                onPress={() => toggleSkill(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.modalSkillText,
                    safeSelectedSkills.includes(item) && styles.modalSkillTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {safeSelectedSkills.includes(item) && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  customSkillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
  },
  customSkillText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.white,
  },
  removeIcon: {
    fontSize: 18,
    color: theme.colors.white,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  skillChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0F7FF',
  },
  skillChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  skillChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  showMoreButton: {
    padding: 12,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  addButton: {
    width: 56,
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 28,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeButton: {
    fontSize: 28,
    color: theme.colors.text,
    fontWeight: '300',
  },
  modalList: {
    padding: 20,
    gap: 12,
  },
  modalSkill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  modalSkillSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0F7FF',
  },
  modalSkillText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  modalSkillTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

