import { ExerciseCard } from '@components/ExerciseCard';
import { Group } from '@components/Group';
import { HomeHeader } from '@components/HomeHeader';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AppNavigatorRoutesProps } from '@routes/app.routes';
import { VStack, FlatList, HStack, Heading, Text, useToast } from 'native-base';
import { useState, useEffect, useCallback } from 'react'
import { api } from '@services/api';
import { AppError } from '@utils/AppError';
import { ExerciseDTO } from '@dtos/ExerciseDTO';
import { Loading } from '@components/Loading';

export function Home(){
    const [isLoading, setIsLoading] = useState(true);
    const [group, setGroup] = useState<string[]>([]);
    const [exercises, setExercises] = useState<ExerciseDTO[]>([]);
    const [groupSelected, setGroupSelected] = useState('antebraço');

    const toast = useToast();
    const navegation = useNavigation<AppNavigatorRoutesProps>();

    function handleOpenExerciseDetails(exerciseId: string){
        navegation.navigate('exercise', {exerciseId})
    }

    async function fethGroups() {
        try {
            const response = await api.get('/groups');
            setGroup(response.data)

        } catch (error) {
            const isAppError = error instanceof AppError;
            const title = isAppError ? error.message : 'Não foi posível carregar os grupos musculares.'
            toast.show({
                title,
                placement: 'top',
                bgColor: 'red.500'
            })
        } 
    }

    async function fethExercisesByGrup() {
        try {
            setIsLoading(true)
            const response = await api.get(`/exercises/bygroup/${groupSelected}`);
            setExercises(response.data);

        } catch (error) {
            const isAppError = error instanceof AppError;
            const title = isAppError ? error.message : 'Não foi posível carregar os exercícios desse grupo.'
            toast.show({
                title,
                placement: 'top',
                bgColor: 'red.500'
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(()=>{fethGroups();},[])
    useFocusEffect(useCallback(()=>{fethExercisesByGrup();},[groupSelected]))

    return (
        <VStack flex={1}>
            <HomeHeader />

            <FlatList 
                data={group}
                keyExtractor={item => item}
                renderItem={({item}) => (
                    <Group 
                        name={item} 
                        isActive={String(groupSelected).toLocaleUpperCase() === item.toLocaleUpperCase()} 
                        onPress={() => setGroupSelected(item)}
                    />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                _contentContainerStyle={{ px: 8 }}
                my={10}
                maxH={10}
                minH={10}
            />
            {
                isLoading ? <Loading/> :
                <VStack flex={1} px={8}>
                    <HStack justifyContent="space-between" mb={5}>
                        <Heading color="gray.200" fontSize="md" fontFamily="heading">
                            Exercícios
                        </Heading>
                        <Text color="gray.200" fontSize="sm">
                            {exercises.length}
                        </Text>
                    </HStack>
                    
                    <FlatList 
                        data={exercises}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <ExerciseCard 
                                data={item}
                                onPress={() => handleOpenExerciseDetails(item.id)}
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                        _contentContainerStyle={{ paddingBottom: 20 }}
                    />
                </VStack>
            }
                
        </VStack>
    );
}